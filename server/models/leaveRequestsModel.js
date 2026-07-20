import { query } from '../config/db.js'

const LEAVE_SELECT = `
  lr.id,
  lr.employee_id AS "employeeId",
  e.name AS "employeeName",
  e.department_id AS "departmentId",
  d.head_employee_id AS "departmentHeadId",
  e.casual_leave_balance AS "casualLeaveBalance",
  e.sick_leave_balance AS "sickLeaveBalance",
  e.lop_days AS "lopDays",
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.employee_id = lr.employee_id
      AND u.role = 'hr'
  ) AS "requesterIsHr",
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.employee_id = lr.employee_id
      AND u.role = 'admin'
  ) AS "requesterIsAdmin",
  lr.leave_type AS "leaveType",
  TO_CHAR(lr.start_date, 'YYYY-MM-DD') AS "startDate",
  TO_CHAR(lr.end_date, 'YYYY-MM-DD') AS "endDate",
  lr.leave_days AS "leaveDays",
  lr.reason,
  lr.cancellation_reason AS "cancellationReason",
  lr.rejection_reason AS "rejectionReason",
  lr.status
`

const LEAVE_FROM = `
  FROM leave_requests lr
  INNER JOIN employees e ON e.id = lr.employee_id
  LEFT JOIN departments d ON d.id = e.department_id
`

const HISTORY_SELECT = `
  h.id,
  h.leave_request_id AS "leaveRequestId",
  h.step,
  h.action,
  h.actor_user_id AS "actorUserId",
  h.actor_employee_id AS "actorEmployeeId",
  h.actor_name AS "actorName",
  h.actor_role AS "actorRole",
  h.remarks,
  TO_CHAR(h.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "createdAt"
`

export async function findAllLeaveRequests() {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    ORDER BY lr.id DESC`,
  )

  return result.rows
}

export async function findLeaveRequestsByEmployeeId(employeeId) {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    WHERE lr.employee_id = $1
    ORDER BY lr.id DESC`,
    [employeeId],
  )

  return result.rows
}

/** Own requests + requests from departments this employee heads. */
export async function findLeaveRequestsVisibleToEmployee(employeeId) {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    WHERE lr.employee_id = $1
       OR d.head_employee_id = $1
    ORDER BY lr.id DESC`,
    [employeeId],
  )

  return result.rows
}

/** Team leave queue for a department head (excludes the head's own requests). */
export async function findLeaveRequestsForTeamApprovals(headEmployeeId) {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    WHERE d.head_employee_id = $1
      AND lr.employee_id <> $1
    ORDER BY lr.id DESC`,
    [headEmployeeId],
  )

  return result.rows
}

/** HR/Admin employee leave queue (optionally excludes the reviewer's own requests). */
export async function findLeaveRequestsForHrApprovals(excludeEmployeeId = null) {
  if (excludeEmployeeId) {
    const result = await query(
      `SELECT ${LEAVE_SELECT}
      ${LEAVE_FROM}
      WHERE lr.employee_id <> $1
      ORDER BY lr.id DESC`,
      [excludeEmployeeId],
    )
    return result.rows
  }

  return findAllLeaveRequests()
}

export async function findLeaveRequestById(id, client = null) {
  const runner = client || { query }
  const result = await runner.query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    WHERE lr.id = $1`,
    [id],
  )

  return result.rows[0] || null
}

export async function findLeaveApprovalHistory(leaveRequestId) {
  const result = await query(
    `SELECT ${HISTORY_SELECT}
     FROM leave_approval_history h
     WHERE h.leave_request_id = $1
     ORDER BY h.created_at ASC, h.id ASC`,
    [leaveRequestId],
  )

  return result.rows
}

export async function createLeaveApprovalHistoryEntry(
  {
    leaveRequestId,
    step,
    action,
    actorUserId = null,
    actorEmployeeId = null,
    actorName,
    actorRole,
    remarks = '',
  },
  client = null,
) {
  const runner = client || { query }
  const result = await runner.query(
    `INSERT INTO leave_approval_history (
      leave_request_id, step, action,
      actor_user_id, actor_employee_id, actor_name, actor_role, remarks
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      leaveRequestId,
      step,
      action,
      actorUserId,
      actorEmployeeId,
      actorName,
      actorRole,
      remarks,
    ],
  )

  return result.rows[0]
}

export async function generateNextLeaveRequestId() {
  const result = await query(
    `SELECT COALESCE(
      MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)),
      3000
    ) AS max_num
    FROM leave_requests
    WHERE id ~ '^LR-[0-9]+$'`,
  )

  const nextNum = Number(result.rows[0].max_num) + 1
  return `LR-${nextNum}`
}

export async function createLeaveRequest(leaveRequest, client = null) {
  const runner = client || { query }
  const result = await runner.query(
    `INSERT INTO leave_requests (
      id, employee_id, leave_type, start_date, end_date, leave_days, reason, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    )
    RETURNING id`,
    [
      leaveRequest.id,
      leaveRequest.employeeId,
      leaveRequest.leaveType,
      leaveRequest.startDate,
      leaveRequest.endDate,
      leaveRequest.leaveDays,
      leaveRequest.reason,
      leaveRequest.status,
    ],
  )

  return findLeaveRequestById(result.rows[0].id, client)
}

export async function updateLeaveRequestStatus(
  id,
  status,
  allowedFromStatuses,
  { rejectionReason = '', client = null } = {},
) {
  const runner = client || { query }
  const result = await runner.query(
    `UPDATE leave_requests
     SET status = $2::varchar,
         rejection_reason = CASE
           WHEN $2::text = 'Rejected' THEN $4::text
           ELSE rejection_reason
         END,
         updated_at = NOW()
     WHERE id = $1
       AND status = ANY($3::text[])
     RETURNING id`,
    [id, status, allowedFromStatuses, rejectionReason],
  )

  if (result.rowCount === 0) return null
  return findLeaveRequestById(id, client)
}

export async function cancelLeaveRequest(
  id,
  { employeeId, cancellationReason, asTeamLeadHeadId = null },
) {
  const params = [id, cancellationReason]
  let ownershipClause = ''

  if (asTeamLeadHeadId) {
    ownershipClause = `AND employee_id IN (
      SELECT e.id FROM employees e
      INNER JOIN departments d ON d.id = e.department_id
      WHERE d.head_employee_id = $3
    )`
    params.push(asTeamLeadHeadId)
  } else if (employeeId) {
    ownershipClause = 'AND employee_id = $3'
    params.push(employeeId)
  }

  const result = await query(
    `UPDATE leave_requests
     SET status = 'Cancelled',
         cancellation_reason = $2,
         updated_at = NOW()
     WHERE id = $1
       ${ownershipClause}
       AND status IN ('Pending', 'TeamLeadApproved')
     RETURNING id`,
    params,
  )

  if (result.rowCount === 0) return null
  return findLeaveRequestById(id)
}

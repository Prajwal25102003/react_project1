import { query } from '../config/db.js'

const LEAVE_SELECT = `
  lr.id,
  lr.employee_id AS "employeeId",
  e.name AS "employeeName",
  lr.leave_type AS "leaveType",
  TO_CHAR(lr.start_date, 'YYYY-MM-DD') AS "startDate",
  TO_CHAR(lr.end_date, 'YYYY-MM-DD') AS "endDate",
  lr.leave_days AS "leaveDays",
  lr.reason,
  lr.status
`

export async function findAllLeaveRequests() {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    FROM leave_requests lr
    INNER JOIN employees e ON e.id = lr.employee_id
    ORDER BY lr.id DESC`,
  )

  return result.rows
}

export async function findLeaveRequestsByEmployeeId(employeeId) {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    FROM leave_requests lr
    INNER JOIN employees e ON e.id = lr.employee_id
    WHERE lr.employee_id = $1
    ORDER BY lr.id DESC`,
    [employeeId],
  )

  return result.rows
}

export async function findLeaveRequestById(id) {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    FROM leave_requests lr
    INNER JOIN employees e ON e.id = lr.employee_id
    WHERE lr.id = $1`,
    [id],
  )

  return result.rows[0] || null
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

export async function createLeaveRequest(leaveRequest) {
  const result = await query(
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

  return findLeaveRequestById(result.rows[0].id)
}

export async function updateLeaveRequestStatus(id, status) {
  const result = await query(
    `UPDATE leave_requests
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, status],
  )

  if (result.rowCount === 0) return null
  return findLeaveRequestById(id)
}

export async function cancelLeaveRequest(id, employeeId) {
  const result = await query(
    `UPDATE leave_requests
     SET status = 'Cancelled', updated_at = NOW()
     WHERE id = $1
       AND employee_id = $2
       AND status = 'Pending'
     RETURNING id`,
    [id, employeeId],
  )

  if (result.rowCount === 0) return null
  return findLeaveRequestById(id)
}


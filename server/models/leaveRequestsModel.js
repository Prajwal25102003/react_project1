import { query } from '../config/db.js'
import {
  findStepsByHierarchyIds,
  firstActionableStepOrder,
} from './leaveApprovalHierarchyModel.js'

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
  lr.leave_days::float AS "leaveDays",
  lr.half_day_session AS "halfDaySession",
  lr.reason,
  lr.attachment_url AS "attachmentUrl",
  lr.cancellation_reason AS "cancellationReason",
  lr.rejection_reason AS "rejectionReason",
  lr.status,
  lr.hierarchy_id AS "hierarchyId",
  lr.current_step AS "currentStep"
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

const REQUEST_STEP_SELECT = `
  s.id,
  s.leave_request_id AS "leaveRequestId",
  s.step_order AS "stepOrder",
  s.approver_kind AS "approverKind",
  s.approver_role AS "approverRole",
  s.approver_employee_id AS "approverEmployeeId",
  e.name AS "approverEmployeeName"
`

function mapRequestStepRow(row) {
  return {
    id: row.id,
    leaveRequestId: row.leaveRequestId,
    stepOrder: Number(row.stepOrder),
    approverKind: row.approverKind,
    approverRole: row.approverRole || null,
    approverEmployeeId: row.approverEmployeeId || null,
    approverEmployeeName: row.approverEmployeeName || null,
  }
}

export async function findStepsByLeaveRequestIds(leaveRequestIds, client = null) {
  const runner = client || { query }
  const ids = [...new Set((leaveRequestIds || []).filter(Boolean))]
  if (ids.length === 0) return new Map()

  const result = await runner.query(
    `SELECT ${REQUEST_STEP_SELECT}
     FROM leave_request_hierarchy_steps s
     LEFT JOIN employees e ON e.id = s.approver_employee_id
     WHERE s.leave_request_id = ANY($1::text[])
     ORDER BY s.leave_request_id ASC, s.step_order ASC`,
    [ids],
  )

  const map = new Map()
  for (const row of result.rows) {
    const list = map.get(row.leaveRequestId) || []
    list.push(mapRequestStepRow(row))
    map.set(row.leaveRequestId, list)
  }
  return map
}

export async function replaceLeaveRequestHierarchySteps(
  leaveRequestId,
  steps,
  client = null,
) {
  const runner = client || { query }
  await runner.query(
    `DELETE FROM leave_request_hierarchy_steps WHERE leave_request_id = $1`,
    [leaveRequestId],
  )

  for (const step of steps || []) {
    await runner.query(
      `INSERT INTO leave_request_hierarchy_steps (
        leave_request_id, step_order, approver_kind, approver_role, approver_employee_id
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        leaveRequestId,
        step.stepOrder,
        step.approverKind,
        step.approverRole || null,
        step.approverEmployeeId || null,
      ],
    )
  }
}

/**
 * Apply a newly saved hierarchy to Pending leave still on their first snapshot step
 * (no intermediate approval yet). Mid-flight requests keep their frozen snapshot.
 */
export async function refreshPendingStepOneHierarchySnapshots(
  hierarchyId,
  steps,
  client = null,
) {
  const runner = client || { query }
  if (!hierarchyId || !steps?.length) return 0

  const result = await runner.query(
    `SELECT
       lr.id,
       lr.employee_id AS "employeeId",
       d.head_employee_id AS "departmentHeadId",
       lr.current_step AS "currentStep",
       (
         SELECT MIN(s.step_order)
         FROM leave_request_hierarchy_steps s
         WHERE s.leave_request_id = lr.id
       ) AS "firstStep"
     FROM leave_requests lr
     INNER JOIN employees e ON e.id = lr.employee_id
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE lr.hierarchy_id = $1
       AND lr.status = 'Pending'
       AND lr.current_step IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM leave_approval_history h
         WHERE h.leave_request_id = lr.id
           AND h.action = 'Approved'
           AND h.step <> 'Submit'
       )`,
    [hierarchyId],
  )

  let updated = 0
  for (const row of result.rows) {
    const firstStep =
      row.firstStep === null || row.firstStep === undefined
        ? null
        : Number(row.firstStep)
    const currentStep = Number(row.currentStep)

    // Still waiting on the first snapshot step (or missing snapshot → treat as step-1).
    if (firstStep != null && currentStep !== firstStep) continue

    const nextCurrentStep = firstActionableStepOrder(steps, {
      employeeId: row.employeeId,
      departmentHeadId: row.departmentHeadId || null,
    })

    await replaceLeaveRequestHierarchySteps(row.id, steps, client)
    await runner.query(
      `UPDATE leave_requests
       SET current_step = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, nextCurrentStep],
    )
    updated += 1
  }

  return updated
}

export async function attachHierarchySteps(leaveRequests, client = null) {
  const rows = Array.isArray(leaveRequests) ? leaveRequests : []
  if (rows.length === 0) return rows

  const stepsByRequest = await findStepsByLeaveRequestIds(
    rows.map((row) => row.id),
    client,
  )

  const missingHierarchyIds = rows
    .filter((row) => !(stepsByRequest.get(row.id) || []).length)
    .map((row) => row.hierarchyId)
  const fallbackByHierarchy = await findStepsByHierarchyIds(missingHierarchyIds)

  return rows.map((row) => {
    const snapshot = stepsByRequest.get(row.id) || []
    const hierarchySteps =
      snapshot.length > 0
        ? snapshot
        : fallbackByHierarchy.get(row.hierarchyId) || []

    return {
      ...row,
      currentStep:
        row.currentStep === null || row.currentStep === undefined
          ? null
          : Number(row.currentStep),
      hierarchySteps,
    }
  })
}

async function withSteps(rows) {
  return attachHierarchySteps(rows)
}

export async function findAllLeaveRequests() {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    ORDER BY lr.id DESC`,
  )

  return withSteps(result.rows)
}

export async function findLeaveRequestsByEmployeeId(employeeId) {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    WHERE lr.employee_id = $1
    ORDER BY lr.id DESC`,
    [employeeId],
  )

  return withSteps(result.rows)
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

  return withSteps(result.rows)
}

/**
 * Leave queue awaiting action by this actor (role and/or employee).
 */
export async function findLeaveRequestsAwaitingActor({
  role = null,
  employeeId = null,
} = {}) {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    INNER JOIN leave_request_hierarchy_steps s
      ON s.leave_request_id = lr.id
     AND s.step_order = lr.current_step
    WHERE lr.status = 'Pending'
      AND lr.current_step IS NOT NULL
      AND (
        (
          s.approver_kind = 'department_head'
          AND $2::text IS NOT NULL
          AND d.head_employee_id = $2
          AND lr.employee_id <> $2
        )
        OR (
          s.approver_kind = 'role'
          AND $1::text IS NOT NULL
          AND s.approver_role = $1
        )
        OR (
          s.approver_kind = 'employee'
          AND $2::text IS NOT NULL
          AND s.approver_employee_id = $2
        )
      )
    ORDER BY lr.id DESC`,
    [role || null, employeeId || null],
  )

  return withSteps(result.rows)
}

/** Leave requests whose frozen snapshot includes a given role approver step. */
export async function findLeaveRequestsWithApproverRole(approverRole) {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    WHERE EXISTS (
      SELECT 1
      FROM leave_request_hierarchy_steps s
      WHERE s.leave_request_id = lr.id
        AND s.approver_kind = 'role'
        AND s.approver_role = $1
    )
    ORDER BY lr.id DESC`,
    [approverRole],
  )

  return withSteps(result.rows)
}

/** Team leave for a department head (all statuses; excludes the head's own requests). */
export async function findLeaveRequestsForTeamApprovals(headEmployeeId) {
  const result = await query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    WHERE d.head_employee_id = $1
      AND lr.employee_id <> $1
    ORDER BY lr.id DESC`,
    [headEmployeeId],
  )

  return withSteps(result.rows)
}

/** @deprecated Prefer findLeaveRequestsAwaitingActor */
export async function findLeaveRequestsForAdminApprovals() {
  return findLeaveRequestsAwaitingActor({ role: 'admin' })
}

/** @deprecated Prefer findLeaveRequestsAwaitingActor */
export async function findLeaveRequestsForHrApprovals(excludeEmployeeId = null) {
  const rows = await findLeaveRequestsAwaitingActor({ role: 'hr' })
  if (!excludeEmployeeId) return rows
  return rows.filter((row) => row.employeeId !== excludeEmployeeId)
}

export async function findLeaveRequestById(id, client = null) {
  const runner = client || { query }
  const result = await runner.query(
    `SELECT ${LEAVE_SELECT}
    ${LEAVE_FROM}
    WHERE lr.id = $1`,
    [id],
  )

  const row = result.rows[0] || null
  if (!row) return null
  const [withStep] = await attachHierarchySteps([row], client)
  return withStep
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
      id, employee_id, leave_type, start_date, end_date, leave_days,
      half_day_session, reason, attachment_url, status,
      hierarchy_id, current_step
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    )
    RETURNING id`,
    [
      leaveRequest.id,
      leaveRequest.employeeId,
      leaveRequest.leaveType,
      leaveRequest.startDate,
      leaveRequest.endDate,
      leaveRequest.leaveDays,
      leaveRequest.halfDaySession || null,
      leaveRequest.reason,
      leaveRequest.attachmentUrl || null,
      leaveRequest.status,
      leaveRequest.hierarchyId || null,
      leaveRequest.currentStep ?? null,
    ],
  )

  const leaveRequestId = result.rows[0].id
  if (leaveRequest.hierarchySteps?.length) {
    await replaceLeaveRequestHierarchySteps(
      leaveRequestId,
      leaveRequest.hierarchySteps,
      client,
    )
  }

  return findLeaveRequestById(leaveRequestId, client)
}

export async function updateLeaveRequestStatus(
  id,
  status,
  allowedFromStatuses,
  {
    rejectionReason = '',
    currentStep = undefined,
    client = null,
  } = {},
) {
  const runner = client || { query }
  const clearStep = status === 'Approved' || status === 'Rejected' || status === 'Cancelled'
  const nextStep =
    currentStep !== undefined
      ? currentStep
      : clearStep
        ? null
        : undefined

  const result = await runner.query(
    `UPDATE leave_requests
     SET status = $2::varchar,
         rejection_reason = CASE
           WHEN $2::text = 'Rejected' THEN $4::text
           ELSE rejection_reason
         END,
         current_step = CASE
           WHEN $5::boolean THEN $6::integer
           ELSE current_step
         END,
         updated_at = NOW()
     WHERE id = $1
       AND status = ANY($3::text[])
     RETURNING id`,
    [
      id,
      status,
      allowedFromStatuses,
      rejectionReason,
      nextStep !== undefined,
      nextStep === undefined ? null : nextStep,
    ],
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
         current_step = NULL,
         updated_at = NOW()
     WHERE id = $1
       ${ownershipClause}
       AND status = 'Pending'
     RETURNING id`,
    params,
  )

  if (result.rowCount === 0) return null
  return findLeaveRequestById(id)
}

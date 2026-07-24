import { query } from '../config/db.js'

/**
 * Deduction order on approval:
 * - Medical Leave / Sick Leave → sick → casual → LOP
 * - Casual Leave → casual → sick → LOP
 * - Maternity Leave → paid (2 weeks before + 24 weeks after delivery); no sick/casual/LOP change
 * - Work from Home → attendance exception; no sick/casual/LOP change
 * - Loss of Pay / other → LOP
 * LOP is applied only after both casual and sick paid quotas are exhausted
 * (except when the leave type is explicitly Loss of Pay).
 */
export function computeLeaveDeduction(
  { casualLeaveBalance = 0, sickLeaveBalance = 0, lopDays = 0 },
  leaveType,
  leaveDays,
) {
  const days = Math.max(0, Number(leaveDays) || 0)
  let casual = Math.max(0, Number(casualLeaveBalance) || 0)
  let sick = Math.max(0, Number(sickLeaveBalance) || 0)
  let lop = Math.max(0, Number(lopDays) || 0)
  let remaining = days
  let fromSick = 0
  let fromCasual = 0
  let fromLop = 0

  const type = String(leaveType || '').trim()

  if (
    days === 0 ||
    type === 'Maternity Leave' ||
    type === 'Work from Home'
  ) {
    return {
      casualLeaveBalance: casual,
      sickLeaveBalance: sick,
      lopDays: lop,
      fromSick,
      fromCasual,
      fromLop,
    }
  }

  if (type === 'Medical Leave' || type === 'Sick Leave') {
    fromSick = Math.min(sick, remaining)
    sick -= fromSick
    remaining -= fromSick

    fromCasual = Math.min(casual, remaining)
    casual -= fromCasual
    remaining -= fromCasual

    fromLop = remaining
    lop += remaining
    remaining = 0
  } else if (type === 'Casual Leave') {
    fromCasual = Math.min(casual, remaining)
    casual -= fromCasual
    remaining -= fromCasual

    fromSick = Math.min(sick, remaining)
    sick -= fromSick
    remaining -= fromSick

    fromLop = remaining
    lop += remaining
    remaining = 0
  } else {
    // Loss of Pay and any other type without a paid quota → LOP
    fromLop = remaining
    lop += remaining
    remaining = 0
  }

  return {
    casualLeaveBalance: casual,
    sickLeaveBalance: sick,
    lopDays: lop,
    fromSick,
    fromCasual,
    fromLop,
  }
}

export async function getEmployeeLeaveBalances(employeeId, client = null) {
  const runner = client || { query }
  const result = await runner.query(
    `SELECT
      casual_leave_balance AS "casualLeaveBalance",
      sick_leave_balance AS "sickLeaveBalance",
      lop_days AS "lopDays"
     FROM employees
     WHERE id = $1`,
    [employeeId],
  )
  return result.rows[0] || null
}

export async function setEmployeeLeaveBalances(
  employeeId,
  { casualLeaveBalance, sickLeaveBalance, lopDays },
  client = null,
) {
  const runner = client || { query }
  const result = await runner.query(
    `UPDATE employees
     SET casual_leave_balance = $2,
         sick_leave_balance = $3,
         lop_days = $4
     WHERE id = $1
     RETURNING
       casual_leave_balance AS "casualLeaveBalance",
       sick_leave_balance AS "sickLeaveBalance",
       lop_days AS "lopDays"`,
    [employeeId, casualLeaveBalance, sickLeaveBalance, lopDays],
  )
  return result.rows[0] || null
}

export async function deductEmployeeLeaveBalances(
  employeeId,
  leaveType,
  leaveDays,
  client = null,
) {
  const balances = await getEmployeeLeaveBalances(employeeId, client)
  if (!balances) {
    const error = new Error('Employee not found for leave balance deduction')
    error.code = 'EMPLOYEE_NOT_FOUND'
    throw error
  }

  const next = computeLeaveDeduction(balances, leaveType, leaveDays)
  const updated = await setEmployeeLeaveBalances(
    employeeId,
    {
      casualLeaveBalance: next.casualLeaveBalance,
      sickLeaveBalance: next.sickLeaveBalance,
      lopDays: next.lopDays,
    },
    client,
  )

  return { ...updated, fromSick: next.fromSick, fromCasual: next.fromCasual, fromLop: next.fromLop }
}

/**
 * Bulk assign paid leave quotas.
 * @param {{
 *   scope: 'all' | 'department' | 'custom',
 *   mode: 'set' | 'add',
 *   casualLeaveBalance: number,
 *   sickLeaveBalance: number,
 *   departmentId?: string | null,
 *   employeeIds?: string[],
 * }} params
 */
export async function assignLeaveBalances({
  scope,
  mode,
  casualLeaveBalance,
  sickLeaveBalance,
  departmentId = null,
  employeeIds = [],
}) {
  const casual = Math.max(0, Number(casualLeaveBalance) || 0)
  const sick = Math.max(0, Number(sickLeaveBalance) || 0)
  const isAdd = mode === 'add'

  const adminExclude = `
    NOT EXISTS (
      SELECT 1
      FROM users u
      WHERE u.employee_id = e.id
        AND u.role = 'admin'
    )`

  let whereSql = adminExclude
  const params = [casual, sick]
  let nextIndex = 3

  if (scope === 'department') {
    whereSql += ` AND e.department_id = $${nextIndex}`
    params.push(departmentId)
    nextIndex += 1
    if (employeeIds.length > 0) {
      whereSql += ` AND e.id = ANY($${nextIndex}::text[])`
      params.push(employeeIds)
      nextIndex += 1
    }
  } else if (scope === 'custom') {
    whereSql += ` AND e.id = ANY($${nextIndex}::text[])`
    params.push(employeeIds)
    nextIndex += 1
  }

  // All / department: only Active staff. Custom: whatever was selected (still not admin).
  if (scope === 'all' || scope === 'department') {
    whereSql += ` AND e.status = 'Active'`
  }

  const setSql = isAdd
    ? `casual_leave_balance = casual_leave_balance + $1,
       sick_leave_balance = sick_leave_balance + $2`
    : `casual_leave_balance = $1,
       sick_leave_balance = $2`

  const result = await query(
    `UPDATE employees e
     SET ${setSql}
     WHERE ${whereSql}
     RETURNING e.id`,
    params,
  )

  return {
    updatedCount: result.rowCount,
    employeeIds: result.rows.map((row) => row.id),
  }
}

/** Reset quotas then re-apply all Approved leave requests (used by seed scripts). */
export async function rebuildLeaveBalancesFromApprovedLeaves(client = null) {
  const runner = client || { query }

  await runner.query(
    `UPDATE employees
     SET casual_leave_balance = 0,
         sick_leave_balance = 0,
         lop_days = 0`,
  )

  const approved = await runner.query(
    `SELECT employee_id AS "employeeId",
            leave_type AS "leaveType",
            leave_days AS "leaveDays"
     FROM leave_requests
     WHERE status = 'Approved'
     ORDER BY start_date ASC, id ASC`,
  )

  for (const row of approved.rows) {
    await deductEmployeeLeaveBalances(
      row.employeeId,
      row.leaveType,
      row.leaveDays,
      client,
    )
  }

  return approved.rows.length
}

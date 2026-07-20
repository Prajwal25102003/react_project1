import { query } from '../config/db.js'

/**
 * Deduction order on approval:
 * - Medical Leave / Sick Leave → sick → casual → LOP
 * - Casual Leave → casual → LOP
 * - Maternity Leave → paid (2 weeks before + 24 weeks after delivery); no sick/casual/LOP change
 * - Loss of Pay / other → LOP
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

  if (days === 0 || type === 'Maternity Leave') {
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

/** Reset quotas then re-apply all Approved leave requests (used by seed scripts). */
export async function rebuildLeaveBalancesFromApprovedLeaves(client = null) {
  const runner = client || { query }

  await runner.query(
    `UPDATE employees
     SET casual_leave_balance = 1,
         sick_leave_balance = 1,
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

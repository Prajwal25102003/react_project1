/**
 * Seeds attendance for all Active employees from 2026-01-01 through 2026-07-20.
 * Skips weekends. Marks Approved leave days as Absent.
 *
 * Usage:
 *   node server/scripts/seedAttendance.js
 *   import { seedAttendance } from './seedAttendance.js'
 */
import path from 'path'
import { fileURLToPath } from 'url'
import pool, { connectDatabase, query } from '../config/db.js'

const ATTENDANCE_START = '2026-01-01'
const ATTENDANCE_END = '2026-07-20'

function toDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`)
}

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function eachWorkingDay(startStr, endStr) {
  const days = []
  const cursor = parseDate(startStr)
  const end = parseDate(endStr)
  while (cursor <= end) {
    if (!isWeekend(cursor)) days.push(toDateString(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function statusFor(employeeId, dateStr, onLeave) {
  if (onLeave) {
    return { status: 'Absent', checkIn: '—', checkOut: '—', workingHours: 0 }
  }

  const seed =
    Number(String(employeeId).replace(/\D/g, '')) +
    Number(dateStr.replace(/-/g, ''))
  const roll = seed % 40

  if (roll === 0) {
    return { status: 'Absent', checkIn: '—', checkOut: '—', workingHours: 0 }
  }
  if (roll === 1 || roll === 2) {
    return {
      status: 'Half Day',
      checkIn: '09:05 AM',
      checkOut: '01:00 PM',
      workingHours: 4,
    }
  }

  const checkInMinute = 55 + (seed % 20)
  const checkOutMinute = (seed * 3) % 30
  const checkIn =
    checkInMinute >= 60
      ? `09:${String(checkInMinute - 60).padStart(2, '0')} AM`
      : `08:${String(checkInMinute).padStart(2, '0')} AM`
  const checkOut = `06:${String(checkOutMinute).padStart(2, '0')} PM`
  const workingHours = Number((8.5 + (seed % 10) / 20).toFixed(2))

  return { status: 'Present', checkIn, checkOut, workingHours }
}

async function loadApprovedLeaveDays() {
  const result = await query(
    `SELECT employee_id AS "employeeId",
            TO_CHAR(start_date, 'YYYY-MM-DD') AS "startDate",
            TO_CHAR(end_date, 'YYYY-MM-DD') AS "endDate"
     FROM leave_requests
     WHERE status = 'Approved'`,
  )

  const byEmployee = new Map()
  for (const row of result.rows) {
    const set = byEmployee.get(row.employeeId) || new Set()
    const cursor = parseDate(row.startDate)
    const end = parseDate(row.endDate)
    while (cursor <= end) {
      set.add(toDateString(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    byEmployee.set(row.employeeId, set)
  }
  return byEmployee
}

export async function seedAttendance({
  startDate = ATTENDANCE_START,
  endDate = ATTENDANCE_END,
} = {}) {
  const employeesResult = await query(
    `SELECT e.id
     FROM employees e
     WHERE e.status = 'Active'
       AND NOT EXISTS (
         SELECT 1
         FROM users u
         WHERE u.employee_id = e.id
           AND u.role = ANY($1::text[])
       )
     ORDER BY e.id ASC`,
    [['hr', 'admin']],
  )

  const employeeIds = employeesResult.rows.map((row) => row.id)
  const workingDays = eachWorkingDay(startDate, endDate)
  const leaveDaysByEmployee = await loadApprovedLeaveDays()

  await query(`DELETE FROM attendance`)

  let nextId = 5001
  const batchSize = 400
  let inserted = 0

  for (let i = 0; i < employeeIds.length; i += 1) {
    const employeeId = employeeIds[i]
    const leaveSet = leaveDaysByEmployee.get(employeeId) || new Set()
    const values = []
    const params = []

    for (const dateStr of workingDays) {
      // Skip dates before the employee's joining date if we had it; keep simple for seed.
      const row = statusFor(employeeId, dateStr, leaveSet.has(dateStr))
      const base = params.length
      values.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`,
      )
      params.push(
        `ATT-${nextId}`,
        employeeId,
        dateStr,
        row.checkIn,
        row.checkOut,
        row.workingHours,
        row.status,
      )
      nextId += 1

      if (values.length >= batchSize) {
        await query(
          `INSERT INTO attendance (
            id, employee_id, attendance_date, check_in, check_out, working_hours, status
          ) VALUES ${values.join(', ')}
          ON CONFLICT (employee_id, attendance_date) DO NOTHING`,
          params,
        )
        inserted += values.length
        values.length = 0
        params.length = 0
      }
    }

    if (values.length > 0) {
      await query(
        `INSERT INTO attendance (
          id, employee_id, attendance_date, check_in, check_out, working_hours, status
        ) VALUES ${values.join(', ')}
        ON CONFLICT (employee_id, attendance_date) DO NOTHING`,
        params,
      )
      inserted += values.length
    }
  }

  console.log(
    `Seeded ~${inserted} attendance rows for ${employeeIds.length} employees (${startDate} → ${endDate}, weekdays)`,
  )
  return inserted
}

async function main() {
  await connectDatabase()
  await seedAttendance()
  await pool.end()
}

const runningDirectly =
  path.resolve(fileURLToPath(import.meta.url)) ===
  path.resolve(process.argv[1] || '')

if (runningDirectly) {
  main().catch(async (error) => {
    console.error(error)
    try {
      await pool.end()
    } catch {
      // ignore
    }
    process.exit(1)
  })
}

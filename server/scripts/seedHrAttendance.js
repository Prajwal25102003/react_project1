/**
 * Backfill attendance for HR-linked employees (same weekday window as seedAttendance).
 * Does not delete existing rows — uses ON CONFLICT DO NOTHING.
 *
 * Usage:
 *   node server/scripts/seedHrAttendance.js
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

function statusFor(employeeId, dateStr) {
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

export async function seedHrAttendance({
  startDate = ATTENDANCE_START,
  endDate = ATTENDANCE_END,
} = {}) {
  const employeesResult = await query(
    `SELECT e.id
     FROM employees e
     INNER JOIN users u ON u.employee_id = e.id
     WHERE e.status = 'Active'
       AND u.role = 'hr'
     ORDER BY e.id ASC`,
  )

  const employeeIds = employeesResult.rows.map((row) => row.id)
  if (employeeIds.length === 0) {
    console.log('No HR-linked employees found — nothing to seed.')
    return 0
  }

  const idResult = await query(
    `SELECT COALESCE(
       MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),
       5000
     ) AS max_num
     FROM attendance
     WHERE id ~ '^ATT-[0-9]+$'`,
  )
  let nextId = Number(idResult.rows[0].max_num) + 1
  const workingDays = eachWorkingDay(startDate, endDate)
  let inserted = 0

  for (const employeeId of employeeIds) {
    const values = []
    const params = []

    for (const dateStr of workingDays) {
      const row = statusFor(employeeId, dateStr)
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
    }

    const result = await query(
      `INSERT INTO attendance (
        id, employee_id, attendance_date, check_in, check_out, working_hours, status
      ) VALUES ${values.join(', ')}
      ON CONFLICT (employee_id, attendance_date) DO NOTHING
      RETURNING id`,
      params,
    )
    inserted += result.rows.length
  }

  console.log(
    `Seeded ${inserted} new attendance row(s) for ${employeeIds.length} HR employee(s) (${startDate} → ${endDate}, weekdays)`,
  )
  return inserted
}

async function main() {
  await connectDatabase()
  await seedHrAttendance()
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

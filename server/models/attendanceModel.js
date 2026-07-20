import { query } from '../config/db.js'

const ATTENDANCE_SELECT = `
  a.id,
  a.employee_id AS "employeeId",
  e.name AS "employeeName",
  TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS date,
  a.check_in AS "checkIn",
  a.check_out AS "checkOut",
  a.working_hours AS "workingHours",
  a.status
`

/** Default window for list endpoints (days back from today, inclusive). */
export const DEFAULT_ATTENDANCE_DAYS = 220
const MAX_ATTENDANCE_DAYS = 365

export function normalizeAttendanceDays(value) {
  const days = Number(value)
  if (!Number.isFinite(days) || days <= 0) return DEFAULT_ATTENDANCE_DAYS
  return Math.min(Math.floor(days), MAX_ATTENDANCE_DAYS)
}

export async function findAllAttendance({
  days = DEFAULT_ATTENDANCE_DAYS,
} = {}) {
  const windowDays = normalizeAttendanceDays(days)
  const result = await query(
    `SELECT ${ATTENDANCE_SELECT}
    FROM attendance a
    INNER JOIN employees e ON e.id = a.employee_id
    WHERE a.attendance_date >= CURRENT_DATE - $1::integer
    ORDER BY a.attendance_date DESC, a.id ASC`,
    [windowDays],
  )

  return result.rows
}

export async function findAttendanceByEmployeeId(
  employeeId,
  { days = DEFAULT_ATTENDANCE_DAYS } = {},
) {
  const windowDays = normalizeAttendanceDays(days)
  const result = await query(
    `SELECT ${ATTENDANCE_SELECT}
    FROM attendance a
    INNER JOIN employees e ON e.id = a.employee_id
    WHERE a.employee_id = $1
      AND a.attendance_date >= CURRENT_DATE - $2::integer
    ORDER BY a.attendance_date DESC, a.id ASC`,
    [employeeId, windowDays],
  )

  return result.rows
}

export async function findAttendanceById(id) {
  const result = await query(
    `SELECT ${ATTENDANCE_SELECT}
    FROM attendance a
    INNER JOIN employees e ON e.id = a.employee_id
    WHERE a.id = $1`,
    [id],
  )

  return result.rows[0] || null
}

export async function generateNextAttendanceId() {
  const result = await query(
    `SELECT COALESCE(
      MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),
      5000
    ) AS max_num
    FROM attendance
    WHERE id ~ '^ATT-[0-9]+$'`,
  )

  const nextNum = Number(result.rows[0].max_num) + 1
  return `ATT-${nextNum}`
}

export async function createAttendance(record) {
  const result = await query(
    `INSERT INTO attendance (
      id, employee_id, attendance_date, check_in, check_out, working_hours, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7
    )
    RETURNING id`,
    [
      record.id,
      record.employeeId,
      record.date,
      record.checkIn,
      record.checkOut,
      record.workingHours,
      record.status,
    ],
  )

  return findAttendanceById(result.rows[0].id)
}

export async function updateAttendance(id, record) {
  const result = await query(
    `UPDATE attendance SET
      employee_id = $2,
      attendance_date = $3,
      check_in = $4,
      check_out = $5,
      working_hours = $6,
      status = $7
    WHERE id = $1
    RETURNING id`,
    [
      id,
      record.employeeId,
      record.date,
      record.checkIn,
      record.checkOut,
      record.workingHours,
      record.status,
    ],
  )

  if (result.rowCount === 0) return null
  return findAttendanceById(id)
}

export async function deleteAttendanceById(id) {
  const result = await query(
    `DELETE FROM attendance WHERE id = $1 RETURNING id`,
    [id],
  )
  return result.rowCount > 0
}

/**
 * Insert or update attendance by (employee_id, attendance_date).
 * Returns { action: 'inserted' | 'updated', id }
 */
export async function upsertAttendanceByEmployeeDate(record, client = null) {
  const runner = client || { query }

  const existing = await runner.query(
    `SELECT id
     FROM attendance
     WHERE employee_id = $1
       AND attendance_date = $2::date
     LIMIT 1`,
    [record.employeeId, record.date],
  )

  if (existing.rows[0]?.id) {
    const id = existing.rows[0].id
    await runner.query(
      `UPDATE attendance SET
        check_in = $2,
        check_out = $3,
        working_hours = $4,
        status = $5
      WHERE id = $1`,
      [id, record.checkIn, record.checkOut, record.workingHours, record.status],
    )
    return { action: 'updated', id }
  }

  const idResult = await runner.query(
    `SELECT COALESCE(
      MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),
      5000
    ) AS max_num
    FROM attendance
    WHERE id ~ '^ATT-[0-9]+$'`,
  )
  const nextNum = Number(idResult.rows[0].max_num) + 1
  const id = `ATT-${nextNum}`

  await runner.query(
    `INSERT INTO attendance (
      id, employee_id, attendance_date, check_in, check_out, working_hours, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      record.employeeId,
      record.date,
      record.checkIn,
      record.checkOut,
      record.workingHours,
      record.status,
    ],
  )

  return { action: 'inserted', id }
}


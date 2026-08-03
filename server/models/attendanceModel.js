import pool, { query } from '../config/db.js'

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

/** True when attendance already exists for this employee on this date. */
export async function attendanceExistsForEmployeeDate(
  employeeId,
  date,
  client = null,
) {
  const runner = client || { query }
  const existing = await runner.query(
    `SELECT 1
     FROM attendance
     WHERE employee_id = $1
       AND attendance_date = $2::date
     LIMIT 1`,
    [employeeId, date],
  )
  return Boolean(existing.rows[0])
}

/**
 * Existing (employeeId|date) keys for a batch of pairs (one round-trip).
 * @param {{ employeeId: string, date: string }[]} pairs
 */
export async function findExistingAttendanceKeys(pairs, client = null) {
  const list = (pairs || []).filter(
    (pair) => pair?.employeeId && pair?.date,
  )
  if (list.length === 0) return new Set()

  const employeeIds = list.map((pair) => pair.employeeId)
  const dates = list.map((pair) => pair.date)
  const runner = client || { query }
  const existing = await runner.query(
    `SELECT employee_id AS "employeeId",
            TO_CHAR(attendance_date, 'YYYY-MM-DD') AS date
     FROM attendance
     WHERE (employee_id, attendance_date) IN (
       SELECT * FROM UNNEST($1::varchar[], $2::date[])
     )`,
    [employeeIds, dates],
  )

  return new Set(
    existing.rows.map((row) => `${row.employeeId}|${row.date}`),
  )
}

/**
 * Insert attendance for (employee_id, attendance_date).
 * Fails if a row for that employee + date already exists.
 * Returns { id }
 */
export async function insertAttendanceByEmployeeDate(record, client = null) {
  const runner = client || { query }

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

  return { id }
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

  const inserted = await insertAttendanceByEmployeeDate(record, client)
  return { action: 'inserted', id: inserted.id }
}

/**
 * Insert-only bulk import inside a transaction.
 * Rejects if any (employeeId, date) already exists.
 * @returns {{ attendanceIds: string[], employeeIds: string[] }}
 */
export async function importAttendanceRecords(records) {
  const list = Array.isArray(records) ? records : []
  if (list.length === 0) {
    return { attendanceIds: [], employeeIds: [] }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const existing = await findExistingAttendanceKeys(list, client)
    if (existing.size > 0) {
      const [first] = existing
      const [employeeId, date] = String(first).split('|')
      const error = new Error(
        `attendance for ${date} already exists for ${employeeId}`,
      )
      error.code = 'ATTENDANCE_EXISTS'
      throw error
    }

    const idResult = await client.query(
      `SELECT COALESCE(
        MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),
        5000
      ) AS max_num
      FROM attendance
      WHERE id ~ '^ATT-[0-9]+$'`,
    )
    let nextNum = Number(idResult.rows[0].max_num) + 1

    const attendanceIds = []
    const employeeIds = []

    for (const record of list) {
      const id = `ATT-${nextNum}`
      nextNum += 1
      await client.query(
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
      attendanceIds.push(id)
      if (record.employeeId) employeeIds.push(record.employeeId)
    }

    await client.query('COMMIT')
    return { attendanceIds, employeeIds }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}


import pool, { query } from '../config/db.js'
import { createAttendanceImportFile } from './attendanceImportFilesModel.js'

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
const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 5

const ATTENDANCE_SORT_COLUMNS = {
  employeeId: 'a.employee_id',
  employeeName: 'e.name',
  date: 'a.attendance_date',
  checkIn: 'a.check_in',
  checkOut: 'a.check_out',
  workingHours: 'a.working_hours',
  status: 'a.status',
}

export function normalizeAttendanceDays(value) {
  const days = Number(value)
  if (!Number.isFinite(days) || days <= 0) return DEFAULT_ATTENDANCE_DAYS
  return Math.min(Math.floor(days), MAX_ATTENDANCE_DAYS)
}

function normalizePageSize(value) {
  const size = Number(value)
  if (!Number.isFinite(size) || size <= 0) return DEFAULT_PAGE_SIZE
  return Math.min(Math.floor(size), MAX_PAGE_SIZE)
}

/**
 * Paginated attendance list with optional filters.
 * When dateFrom/dateTo are set, the rolling days window is skipped.
 */
export async function findAttendancePage({
  days = DEFAULT_ATTENDANCE_DAYS,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  employeeId = null,
  status = null,
  search = null,
  dateFrom = null,
  dateTo = null,
  sortId = 'date',
  sortDir = 'desc',
} = {}) {
  const size = normalizePageSize(pageSize)
  const pageNum = Math.max(1, Math.floor(Number(page) || 1))
  const offset = (pageNum - 1) * size
  const windowDays = normalizeAttendanceDays(days)
  const hasDateBounds = Boolean(dateFrom || dateTo)

  const params = []
  const where = []
  let p = 1

  if (!hasDateBounds) {
    where.push(`a.attendance_date >= CURRENT_DATE - $${p++}::integer`)
    params.push(windowDays)
  }
  if (dateFrom) {
    where.push(`a.attendance_date >= $${p++}::date`)
    params.push(dateFrom)
  }
  if (dateTo) {
    where.push(`a.attendance_date <= $${p++}::date`)
    params.push(dateTo)
  }
  if (employeeId) {
    where.push(`a.employee_id = $${p++}`)
    params.push(employeeId)
  }
  if (status) {
    where.push(`a.status = $${p++}`)
    params.push(status)
  }
  const searchText = String(search || '').trim()
  if (searchText) {
    where.push(`(
      a.employee_id ILIKE $${p}
      OR e.name ILIKE $${p}
      OR a.status ILIKE $${p}
      OR TO_CHAR(a.attendance_date, 'YYYY-MM-DD') ILIKE $${p}
      OR COALESCE(a.check_in, '') ILIKE $${p}
      OR COALESCE(a.check_out, '') ILIKE $${p}
      OR CAST(a.working_hours AS text) ILIKE $${p}
    )`)
    params.push(`%${searchText}%`)
    p += 1
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  const sortCol = ATTENDANCE_SORT_COLUMNS[sortId] || ATTENDANCE_SORT_COLUMNS.date
  const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM attendance a
     INNER JOIN employees e ON e.id = a.employee_id
     ${whereSql}`,
    params,
  )

  const listParams = [...params, size, offset]
  const result = await query(
    `SELECT ${ATTENDANCE_SELECT}
     FROM attendance a
     INNER JOIN employees e ON e.id = a.employee_id
     ${whereSql}
     ORDER BY ${sortCol} ${dir}, a.id ASC
     LIMIT $${p++} OFFSET $${p}`,
    listParams,
  )

  return {
    rows: result.rows,
    total: countResult.rows[0]?.total || 0,
    page: pageNum,
    pageSize: size,
    days: windowDays,
  }
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

export async function deleteAttendanceById(id, client = null) {
  const runner = client || { query }
  const result = await runner.query(
    `DELETE FROM attendance WHERE id = $1 RETURNING id`,
    [id],
  )
  return result.rowCount > 0
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
 * Insert-only bulk import inside a transaction.
 * Rejects if any (employeeId, date) already exists.
 * Optionally stores the batch in attendance_import_files for cleanup on delete.
 * @returns {{ attendanceIds: string[], employeeIds: string[], importFileId: number|null }}
 */
export async function importAttendanceRecords(records, options = {}) {
  const list = Array.isArray(records) ? records : []
  if (list.length === 0) {
    return { attendanceIds: [], employeeIds: [], importFileId: null }
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
    const CHUNK = 200

    for (let offset = 0; offset < list.length; offset += CHUNK) {
      const chunk = list.slice(offset, offset + CHUNK)
      const values = []
      const params = []
      let p = 1

      for (const record of chunk) {
        const id = `ATT-${nextNum}`
        nextNum += 1
        attendanceIds.push(id)
        if (record.employeeId) employeeIds.push(record.employeeId)

        values.push(
          `($${p++}, $${p++}, $${p++}::date, $${p++}, $${p++}, $${p++}, $${p++})`,
        )
        params.push(
          id,
          record.employeeId,
          record.date,
          record.checkIn,
          record.checkOut,
          record.workingHours,
          record.status,
        )
      }

      await client.query(
        `INSERT INTO attendance (
          id, employee_id, attendance_date, check_in, check_out, working_hours, status
        ) VALUES ${values.join(', ')}`,
        params,
      )
    }

    let importFileId = null
    if (options.persistImportFile !== false) {
      const importRows = list.map((record, index) => ({
        attendanceId: attendanceIds[index] || null,
        employeeId: record.employeeId,
        date: record.date,
        status: record.status,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        workingHours: record.workingHours,
      }))
      importFileId = await createAttendanceImportFile(
        {
          filename: options.filename || 'attendance-import.xlsx',
          uploadedBy: options.uploadedBy || null,
          rows: importRows,
        },
        client,
      )
    }

    await client.query('COMMIT')
    return { attendanceIds, employeeIds, importFileId }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}


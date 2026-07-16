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

export async function findAllAttendance() {
  const result = await query(
    `SELECT ${ATTENDANCE_SELECT}
    FROM attendance a
    INNER JOIN employees e ON e.id = a.employee_id
    ORDER BY a.attendance_date DESC, a.id ASC`,
  )

  return result.rows
}

export async function findAttendanceByEmployeeId(employeeId) {
  const result = await query(
    `SELECT ${ATTENDANCE_SELECT}
    FROM attendance a
    INNER JOIN employees e ON e.id = a.employee_id
    WHERE a.employee_id = $1
    ORDER BY a.attendance_date DESC, a.id ASC`,
    [employeeId],
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


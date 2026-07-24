import pool, { query } from '../config/db.js'

const LEAVE_BALANCE_SELECT = `
  e.casual_leave_balance AS "casualLeaveBalance",
  e.sick_leave_balance AS "sickLeaveBalance",
  e.lop_days AS "lopDays",
  COALESCE(pending.pending_count, 0)::integer AS "pendingLeaveCount"
`

const PENDING_LEAVE_JOIN = `
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS pending_count
    FROM leave_requests lr
    WHERE lr.employee_id = e.id
      AND lr.status IN ('Pending', 'TeamLeadApproved')
  ) pending ON TRUE
`

const LOGIN_ROLE_SELECT = `
  u.role AS "loginRole"
`

const EMPLOYEE_FROM = `
  FROM employees e
  LEFT JOIN departments d ON d.id = e.department_id
  LEFT JOIN LATERAL (
    SELECT role
    FROM users
    WHERE employee_id = e.id
    ORDER BY
      CASE role
        WHEN 'admin' THEN 0
        WHEN 'hr' THEN 1
        ELSE 2
      END
    LIMIT 1
  ) u ON TRUE
  ${PENDING_LEAVE_JOIN}
`

const EMPLOYEE_SELECT = `
  e.id,
  e.name,
  e.email,
  e.phone,
  e.gender,
  e.department_id AS "departmentId",
  d.name AS department,
  e.designation,
  TO_CHAR(e.joining_date, 'YYYY-MM-DD') AS "joiningDate",
  e.salary,
  e.status,
  e.avatar,
  ${LEAVE_BALANCE_SELECT},
  ${LOGIN_ROLE_SELECT}
`

/** List DTO omits salary until Payroll needs it on the table. */
const EMPLOYEE_LIST_SELECT = `
  e.id,
  e.name,
  e.email,
  e.phone,
  e.gender,
  e.department_id AS "departmentId",
  d.name AS department,
  e.designation,
  TO_CHAR(e.joining_date, 'YYYY-MM-DD') AS "joiningDate",
  e.status,
  e.avatar,
  ${LEAVE_BALANCE_SELECT},
  ${LOGIN_ROLE_SELECT}
`

function mapEmployeeRow(row) {
  if (!row) return null

  const mapped = {
    ...row,
    casualLeaveBalance: Number(row.casualLeaveBalance ?? 0),
    sickLeaveBalance: Number(row.sickLeaveBalance ?? 0),
    lopDays: Number(row.lopDays ?? 0),
    pendingLeaveCount: Number(row.pendingLeaveCount ?? 0),
  }

  if (row.salary === undefined) return mapped

  return {
    ...mapped,
    salary: Number(row.salary),
  }
}

export async function findAllEmployees({ excludeLoginRoles = [] } = {}) {
  const roles = (excludeLoginRoles || [])
    .map((role) => String(role).toLowerCase())
    .filter(Boolean)

  if (roles.length === 0) {
    const result = await query(
      `SELECT ${EMPLOYEE_LIST_SELECT}
      ${EMPLOYEE_FROM}
      ORDER BY e.id ASC`,
    )
    return result.rows.map(mapEmployeeRow)
  }

  const result = await query(
    `SELECT ${EMPLOYEE_LIST_SELECT}
    ${EMPLOYEE_FROM}
    WHERE NOT EXISTS (
      SELECT 1
      FROM users excluded
      WHERE excluded.employee_id = e.id
        AND excluded.role = ANY($1::text[])
    )
    ORDER BY e.id ASC`,
    [roles],
  )

  return result.rows.map(mapEmployeeRow)
}

/** True when the employee is linked to an hr/admin login (not attendance-eligible). */
export async function employeeHasExcludedLoginRole(
  employeeId,
  roles = ['hr', 'admin'],
) {
  const result = await query(
    `SELECT 1
     FROM users
     WHERE employee_id = $1
       AND role = ANY($2::text[])
     LIMIT 1`,
    [employeeId, roles],
  )
  return result.rows.length > 0
}

export async function findEmployeeById(id) {
  const result = await query(
    `SELECT ${EMPLOYEE_SELECT}
    ${EMPLOYEE_FROM}
    WHERE e.id = $1`,
    [id],
  )

  return mapEmployeeRow(result.rows[0])
}

export async function generateNextEmployeeId() {
  const result = await query(
    `SELECT COALESCE(
      MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),
      1000
    ) AS max_num
    FROM employees
    WHERE id ~ '^EMP-[0-9]+$'`,
  )

  const nextNum = Number(result.rows[0].max_num) + 1
  return `EMP-${nextNum}`
}

export async function createEmployee(employee, client = null) {
  const runner = client || { query }
  const result = await runner.query(
    `INSERT INTO employees (
      id, name, email, phone, gender, department_id, designation,
      joining_date, salary, status, avatar,
      casual_leave_balance, sick_leave_balance, lop_days
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
      COALESCE($12, 1), COALESCE($13, 1), COALESCE($14, 0)
    )
    RETURNING id`,
    [
      employee.id,
      employee.name,
      employee.email,
      employee.phone,
      employee.gender,
      employee.departmentId,
      employee.designation,
      employee.joiningDate,
      employee.salary,
      employee.status,
      employee.avatar,
      employee.casualLeaveBalance ?? 1,
      employee.sickLeaveBalance ?? 1,
      employee.lopDays ?? 0,
    ],
  )

  if (client) {
    return result.rows[0].id
  }
  return findEmployeeById(result.rows[0].id)
}

export async function updateEmployee(id, employee) {
  const result = await query(
    `UPDATE employees SET
      name = $2,
      email = $3,
      phone = $4,
      gender = $5,
      department_id = $6,
      designation = $7,
      joining_date = $8,
      salary = $9,
      status = $10,
      avatar = $11
    WHERE id = $1
    RETURNING id`,
    [
      id,
      employee.name,
      employee.email,
      employee.phone,
      employee.gender,
      employee.departmentId,
      employee.designation,
      employee.joiningDate,
      employee.salary,
      employee.status,
      employee.avatar,
    ],
  )

  if (result.rowCount === 0) return null
  return findEmployeeById(id)
}

export async function deleteEmployeeById(id) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(
      `UPDATE departments
       SET head_employee_id = NULL
       WHERE head_employee_id = $1`,
      [id],
    )
    await client.query(`DELETE FROM attendance WHERE employee_id = $1`, [id])
    await client.query(`DELETE FROM leave_requests WHERE employee_id = $1`, [id])
    await client.query(
      `DELETE FROM users WHERE employee_id = $1 AND role IN ('employee', 'hr')`,
      [id],
    )

    const result = await client.query(
      `DELETE FROM employees WHERE id = $1 RETURNING id`,
      [id],
    )

    await client.query('COMMIT')
    return result.rowCount > 0
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function employeeExists(employeeId) {
  const result = await query(
    `SELECT 1 FROM employees WHERE id = $1 LIMIT 1`,
    [employeeId],
  )
  return result.rowCount > 0
}

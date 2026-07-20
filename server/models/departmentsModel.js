import { query } from '../config/db.js'

const DEPARTMENT_SELECT = `
  d.id,
  d.name,
  d.head_employee_id AS "headEmployeeId",
  h.name AS head,
  COUNT(e.id)::int AS "employeeCount",
  d.description
`

const DEPARTMENT_GROUP = `
  GROUP BY d.id, d.name, d.head_employee_id, h.name, d.description
`

export async function findAllDepartments() {
  const result = await query(
    `SELECT ${DEPARTMENT_SELECT}
    FROM departments d
    LEFT JOIN employees h ON h.id = d.head_employee_id
    LEFT JOIN employees e ON e.department_id = d.id
    ${DEPARTMENT_GROUP}
    ORDER BY d.id ASC`,
  )

  return result.rows
}

export async function findDepartmentById(id) {
  const result = await query(
    `SELECT ${DEPARTMENT_SELECT}
    FROM departments d
    LEFT JOIN employees h ON h.id = d.head_employee_id
    LEFT JOIN employees e ON e.department_id = d.id
    WHERE d.id = $1
    ${DEPARTMENT_GROUP}`,
    [id],
  )

  return result.rows[0] || null
}

export async function isEmployeeDepartmentHead(employeeId) {
  if (!employeeId) return false
  const result = await query(
    `SELECT 1
     FROM departments
     WHERE head_employee_id = $1
     LIMIT 1`,
    [employeeId],
  )
  return result.rowCount > 0
}

export async function generateNextDepartmentId() {
  const result = await query(
    `SELECT COALESCE(
      MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)),
      0
    ) AS max_num
    FROM departments
    WHERE id ~ '^DEP-[0-9]+$'`,
  )

  const nextNum = Number(result.rows[0].max_num) + 1
  return `DEP-${String(nextNum).padStart(2, '0')}`
}

export async function countEmployeesInDepartment(departmentId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count
    FROM employees
    WHERE department_id = $1`,
    [departmentId],
  )

  return result.rows[0].count
}

export async function createDepartment(department) {
  const result = await query(
    `INSERT INTO departments (
      id, name, head_employee_id, description
    ) VALUES (
      $1, $2, $3, $4
    )
    RETURNING id`,
    [
      department.id,
      department.name,
      department.headEmployeeId,
      department.description,
    ],
  )

  return findDepartmentById(result.rows[0].id)
}

export async function updateDepartment(id, department) {
  const result = await query(
    `UPDATE departments SET
      name = $2,
      head_employee_id = $3,
      description = $4
    WHERE id = $1
    RETURNING id`,
    [
      id,
      department.name,
      department.headEmployeeId,
      department.description,
    ],
  )

  if (result.rowCount === 0) return null
  return findDepartmentById(id)
}

export async function deleteDepartmentById(id) {
  const result = await query(
    `DELETE FROM departments WHERE id = $1 RETURNING id`,
    [id],
  )

  return result.rowCount > 0
}

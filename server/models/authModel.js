import bcrypt from 'bcrypt'
import { query } from '../config/db.js'
import { loginRoleForEmployee } from '../utils/loginRole.js'

const BCRYPT_ROUNDS = 10

function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    employeeId: row.employee_id || null,
    passwordHash: row.password_hash,
  }
}

export function toPublicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    employeeId: user.employeeId || null,
  }
}

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS)
}

export async function findUserByEmail(email) {
  const result = await query(
    `SELECT id, email, password_hash, role, employee_id, name
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  )
  return mapUser(result.rows[0])
}

export async function findUserById(id) {
  const result = await query(
    `SELECT id, email, password_hash, role, employee_id, name
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  )
  return mapUser(result.rows[0])
}

export async function findUserByEmployeeId(employeeId) {
  const result = await query(
    `SELECT id, email, password_hash, role, employee_id, name
     FROM users
     WHERE employee_id = $1
     ORDER BY CASE role
       WHEN 'admin' THEN 0
       WHEN 'hr' THEN 1
       ELSE 2
     END
     LIMIT 1`,
    [employeeId],
  )
  return mapUser(result.rows[0])
}

/**
 * Create a login account linked to an employee directory row.
 * Pass an optional `client` to run inside an existing transaction.
 */
export async function createEmployeeUser(
  { email, name, employeeId, passwordHash, role = 'employee' },
  client = null,
) {
  const runner = client || { query }
  const loginRole = role === 'hr' ? 'hr' : 'employee'
  const result = await runner.query(
    `INSERT INTO users (email, password_hash, role, employee_id, name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, password_hash, role, employee_id, name`,
    [email, passwordHash, loginRole, employeeId, name],
  )
  return mapUser(result.rows[0])
}

/**
 * Update login email / password / display name for an employee-linked user.
 * Only provided fields are updated. Admin role is never downgraded.
 * Password hash is unchanged when passwordHash is omitted.
 */
export async function updateEmployeeUserCredentials(
  employeeId,
  { email, name, passwordHash, role },
) {
  const existing = await findUserByEmployeeId(employeeId)
  if (!existing) return null

  const nextEmail = email !== undefined ? email : existing.email
  const nextName = name !== undefined ? name : existing.name
  const nextHash =
    passwordHash !== undefined ? passwordHash : existing.passwordHash

  let nextRole = existing.role
  if (role !== undefined && existing.role !== 'admin') {
    nextRole = role === 'hr' ? 'hr' : 'employee'
  }

  const result = await query(
    `UPDATE users
     SET email = $2, name = $3, password_hash = $4, role = $5
     WHERE id = $1
     RETURNING id, email, password_hash, role, employee_id, name`,
    [existing.id, nextEmail, nextName, nextHash, nextRole],
  )
  return mapUser(result.rows[0])
}

/**
 * Recompute employee/hr login roles for everyone in a department.
 * Admin-linked accounts are left unchanged.
 */
export async function syncDepartmentEmployeeLoginRoles(department) {
  if (!department?.id) return

  const result = await query(
    `SELECT id FROM employees WHERE department_id = $1`,
    [department.id],
  )

  for (const row of result.rows) {
    const role = loginRoleForEmployee({
      departmentName: department.name,
      employeeId: row.id,
      headEmployeeId: department.headEmployeeId,
    })
    await updateEmployeeUserCredentials(row.id, { role })
  }
}

export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash)
}

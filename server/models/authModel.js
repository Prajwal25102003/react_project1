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
    `SELECT u.id, u.email, u.password_hash, u.role, u.employee_id, u.name
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE u.employee_id = $1
     ORDER BY
       CASE
         WHEN e.email IS NOT NULL
           AND lower(u.email) = lower(e.email) THEN 0
         ELSE 1
       END,
       CASE u.role
         WHEN 'admin' THEN 0
         WHEN 'hr' THEN 1
         ELSE 2
       END,
       u.id ASC
     LIMIT 1`,
    [employeeId],
  )
  return mapUser(result.rows[0])
}

export async function findUsersByEmployeeId(employeeId) {
  if (!employeeId) return []
  const result = await query(
    `SELECT id, email, password_hash, role, employee_id, name
     FROM users
     WHERE employee_id = $1
     ORDER BY id ASC`,
    [employeeId],
  )
  return result.rows.map(mapUser)
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
 * When role is provided, every non-admin login linked to this employee is updated
 * so duplicate emails (e.g. hr@… and name@…) stay in sync.
 *
 * Prefer the login that already owns the submitted email so a status-only (or
 * other) save does not reassign that address onto a sibling row and trip the
 * users.email unique constraint.
 */
export async function updateEmployeeUserCredentials(
  employeeId,
  { email, name, passwordHash, role },
) {
  const linked = await findUsersByEmployeeId(employeeId)
  if (linked.length === 0) return null

  const normalizedEmail =
    email !== undefined ? String(email).trim().toLowerCase() : ''
  const emailOwner = normalizedEmail
    ? linked.find(
        (user) => String(user.email || '').trim().toLowerCase() === normalizedEmail,
      )
    : null

  const primary =
    emailOwner ||
    linked.find((user) => user.role === 'admin') ||
    linked.find((user) => user.role === 'hr') ||
    linked[0]

  const nextEmail =
    email !== undefined && !emailOwner ? email : primary.email
  const nextName = name !== undefined ? name : primary.name
  const nextHash =
    passwordHash !== undefined ? passwordHash : primary.passwordHash

  let nextRole = primary.role
  if (role !== undefined && primary.role !== 'admin') {
    nextRole = role === 'hr' ? 'hr' : 'employee'
  }

  // Primary account: full credential update.
  const result = await query(
    `UPDATE users
     SET email = $2, name = $3, password_hash = $4, role = $5
     WHERE id = $1
     RETURNING id, email, password_hash, role, employee_id, name`,
    [primary.id, nextEmail, nextName, nextHash, nextRole],
  )

  // Keep duplicate logins for the same employee on the same role.
  if (role !== undefined) {
    for (const user of linked) {
      if (user.id === primary.id || user.role === 'admin') continue
      await query(
        `UPDATE users
         SET role = $2, name = COALESCE($3, name)
         WHERE id = $1`,
        [user.id, nextRole, name !== undefined ? nextName : null],
      )
    }
  }

  return mapUser(result.rows[0])
}

/**
 * Recompute and persist the correct employee/hr role for one login account
 * (and sibling logins linked to the same employee). Admin accounts unchanged.
 */
export async function syncUserLoginRole(user) {
  if (!user?.id || !user.employeeId || user.role === 'admin') {
    return user
  }

  const result = await query(
    `SELECT
       e.id AS "employeeId",
       d.name AS "departmentName",
       d.head_employee_id AS "headEmployeeId"
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     WHERE e.id = $1`,
    [user.employeeId],
  )
  const row = result.rows[0]
  if (!row) return user

  const nextRole = loginRoleForEmployee({
    departmentName: row.departmentName,
    employeeId: row.employeeId,
    headEmployeeId: row.headEmployeeId,
  })

  if (user.role === nextRole) {
    // Still sync sibling duplicate accounts that may be out of date.
    const siblings = await findUsersByEmployeeId(user.employeeId)
    for (const sibling of siblings) {
      if (sibling.role === 'admin' || sibling.role === nextRole) continue
      await query(`UPDATE users SET role = $2 WHERE id = $1`, [
        sibling.id,
        nextRole,
      ])
    }
    return user.role === nextRole ? user : { ...user, role: nextRole }
  }

  await updateEmployeeUserCredentials(user.employeeId, { role: nextRole })
  return { ...user, role: nextRole }
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

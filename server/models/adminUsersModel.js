import pool, { query } from '../config/db.js'
import { findUserById, toPublicUser } from './authModel.js'

function mapAdminRow(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    employeeId: row.employee_id || null,
    createdAt: row.created_at || null,
  }
}

export async function countAdminUsers() {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`,
  )
  return Number(result.rows[0]?.count || 0)
}

/**
 * Create an admin login linked to an employee profile.
 * Pass an optional `client` to run inside an existing transaction.
 */
export async function createAdminUser(
  { email, name, employeeId, passwordHash },
  client = null,
) {
  const runner = client || { query }
  const result = await runner.query(
    `INSERT INTO users (email, password_hash, role, employee_id, name)
     VALUES ($1, $2, 'admin', $3, $4)
     RETURNING id, email, password_hash, role, employee_id, name, created_at`,
    [email, passwordHash, employeeId, name],
  )
  return mapAdminRow(result.rows[0])
}

/**
 * Remove an admin login. Also removes the linked employee profile when it has
 * no department (admin-only system profile). Refuses to remove the last admin.
 */
export async function deleteAdminUser(userId, { actorUserId } = {}) {
  const user = await findUserById(userId)
  if (!user || user.role !== 'admin') {
    return { ok: false, reason: 'not_found' }
  }

  if (actorUserId && Number(actorUserId) === Number(userId)) {
    return { ok: false, reason: 'self' }
  }

  const adminCount = await countAdminUsers()
  if (adminCount <= 1) {
    return { ok: false, reason: 'last_admin' }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`DELETE FROM users WHERE id = $1 AND role = 'admin'`, [
      userId,
    ])

    if (user.employeeId) {
      const empResult = await client.query(
        `SELECT id, department_id
         FROM employees
         WHERE id = $1
         LIMIT 1`,
        [user.employeeId],
      )
      const employee = empResult.rows[0]
      if (employee && employee.department_id == null) {
        const otherLogins = await client.query(
          `SELECT 1 FROM users WHERE employee_id = $1 LIMIT 1`,
          [user.employeeId],
        )
        if (otherLogins.rowCount === 0) {
          await client.query(`DELETE FROM employees WHERE id = $1`, [
            user.employeeId,
          ])
        }
      }
    }

    await client.query('COMMIT')
    return { ok: true, deleted: toPublicUser(user) }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

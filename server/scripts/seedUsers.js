/**
 * Ensures users table exists and upserts login accounts.
 * Password for all users: 12345678
 *
 * - One user per employee (employee email + department-based role)
 * - Demo accounts: hr@company.com, admin@company.com, arjuntejas@company.com
 *
 * Usage:
 *   node server/scripts/seedUsers.js
 *   node server/scripts/seedUsers.js --force   # DROP + recreate users table
 */
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pool, { connectDatabase, query } from '../config/db.js'
import { loginRoleForDepartmentName } from '../utils/loginRole.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const DEMO_PASSWORD = '12345678'
const forceReset = process.argv.includes('--force')

async function resolveEmployeeUsers() {
  const result = await query(
    `SELECT e.id, e.name, e.email, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     ORDER BY e.id ASC`,
  )

  return result.rows.map((row) => ({
    email: row.email,
    role: loginRoleForDepartmentName(row.department_name),
    name: row.name,
    employeeId: row.id,
  }))
}

async function resolveDemoUsers(employees) {
  const byId = Object.fromEntries(employees.map((row) => [row.employeeId, row]))
  const hrEmployee =
    employees.find((row) => row.role === 'hr') || employees[0] || null
  const selfEmployee =
    byId['EMP-1001'] ||
    employees.find((row) => row.employeeId !== hrEmployee?.employeeId) ||
    employees[0] ||
    null

  return [
    {
      email: 'hr@company.com',
      role: 'hr',
      name: hrEmployee?.name || 'Siddharth Menon',
      employeeId: hrEmployee?.employeeId || null,
    },
    {
      email: 'arjuntejas@company.com',
      role: 'employee',
      name: selfEmployee?.name || 'Employee User',
      employeeId: selfEmployee?.employeeId || null,
    },
    {
      email: 'admin@company.com',
      role: 'admin',
      name: byId['EMP-1']?.name || 'Rahul Aman',
      employeeId: byId['EMP-1']?.employeeId || null,
    },
  ]
}

async function ensureUsersTable() {
  if (forceReset) {
    console.warn('--force: dropping users table')
    await query(`DROP TABLE IF EXISTS users CASCADE`)
  }

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(160) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('hr', 'employee', 'admin')),
      employee_id VARCHAR(20) REFERENCES employees(id) ON DELETE SET NULL,
      name VARCHAR(120) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users (employee_id)
  `)
  await query(`
    ALTER TABLE users DROP COLUMN IF EXISTS password_vault
  `)
}

async function upsertUser(user, passwordHash) {
  await query(
    `INSERT INTO users (email, password_hash, role, employee_id, name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       employee_id = EXCLUDED.employee_id,
       name = EXCLUDED.name`,
    [user.email, passwordHash, user.role, user.employeeId, user.name],
  )
}

async function seed() {
  await connectDatabase()
  await ensureUsersTable()

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const employeeUsers = await resolveEmployeeUsers()
  const demoUsers = await resolveDemoUsers(employeeUsers)

  for (const user of employeeUsers) {
    // Demo admin@company.com owns EMP-1; skip the department-based login for that employee.
    if (user.employeeId === 'EMP-1') continue
    await upsertUser(user, passwordHash)
  }
  console.log(
    `Seeded ${employeeUsers.filter((u) => u.employeeId !== 'EMP-1').length} employee login(s)`,
  )

  for (const user of demoUsers) {
    await upsertUser(user, passwordHash)
    console.log(`Seeded ${user.role}: ${user.email}`)
  }

  const reset = await query(
    `UPDATE users SET password_hash = $1 RETURNING email`,
    [passwordHash],
  )
  console.log(`Password set to ${DEMO_PASSWORD} for ${reset.rowCount} user(s)`)
}

seed()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error)
    await pool.end()
    process.exit(1)
  })

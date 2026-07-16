/**
 * Ensures users table exists and upserts demo accounts.
 * Password for all users: 12345678
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const DEMO_PASSWORD = '12345678'
const forceReset = process.argv.includes('--force')

async function resolveDemoUsers() {
  const employees = await query(
    `SELECT id, name, email FROM employees ORDER BY id ASC`,
  )
  const byId = Object.fromEntries(employees.rows.map((row) => [row.id, row]))
  const hrEmployee = byId['EMP-1002'] || employees.rows[0]
  const selfEmployee =
    employees.rows.find((row) => row.id !== hrEmployee?.id) || employees.rows[0]

  return [
    {
      email: 'hr@company.com',
      role: 'hr',
      name: hrEmployee?.name || 'Siddharth Menon',
      employeeId: hrEmployee?.id || null,
    },
    {
      email: 'arjuntejas@company.com',
      role: 'employee',
      name: selfEmployee?.name || 'Employee User',
      employeeId: selfEmployee?.id || null,
    },
    {
      email: 'admin@company.com',
      role: 'admin',
      name: 'Rahul Aman',
      employeeId: null,
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

async function seed() {
  await connectDatabase()
  await ensureUsersTable()

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const demoUsers = await resolveDemoUsers()

  for (const user of demoUsers) {
    await query(
      `INSERT INTO users (email, password_hash, role, employee_id, name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         employee_id = EXCLUDED.employee_id,
         name = EXCLUDED.name`,
      [
        user.email,
        passwordHash,
        user.role,
        user.employeeId,
        user.name,
      ],
    )
    console.log(`Seeded ${user.role}: ${user.email}`)
  }

  const reset = await query(
    `UPDATE users SET password_hash = $1 RETURNING email`,
    [passwordHash],
  )
  console.log(`Updated password for ${reset.rowCount} user(s)`)
  console.log(`Password for all users: ${DEMO_PASSWORD}`)
}

seed()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error)
    await pool.end()
    process.exit(1)
  })

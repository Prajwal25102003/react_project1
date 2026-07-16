/**
 * Clears demo EMS data and reloads Indian sample data from SQL seeds,
 * then refreshes demo login users.
 *
 * Usage: node server/scripts/reseedIndianData.js
 */
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool, { connectDatabase, query } from '../config/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlDir = path.join(__dirname, '../sql')

async function clearSeedData() {
  await query(`UPDATE departments SET head_employee_id = NULL`)
  await query(`DELETE FROM leave_requests`)
  await query(`DELETE FROM attendance`)
  await query(`DELETE FROM recent_activities`)
  await query(`DELETE FROM users`)
  await query(`DELETE FROM employees`)
  await query(`DELETE FROM departments`)
}

async function runSqlFile(fileName) {
  const fullPath = path.join(sqlDir, fileName)
  const sql = fs.readFileSync(fullPath, 'utf8')
  await query(sql)
  console.log(`Applied ${fileName}`)
}

function runSeedUsers() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(__dirname, 'seedUsers.js')],
      { stdio: 'inherit', cwd: path.join(__dirname, '../..') },
    )
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`seedUsers exited with code ${code}`))
    })
  })
}

async function main() {
  await connectDatabase()
  console.log('Clearing existing seed data…')
  await clearSeedData()
  await runSqlFile('employees.sql')
  await runSqlFile('departments_attendance_leave.sql')
  await runSqlFile('dashboard.sql')
  await pool.end()
  console.log('Seeding demo users…')
  await runSeedUsers()
  console.log('Indian sample data loaded.')
}

main().catch(async (error) => {
  console.error(error)
  try {
    await pool.end()
  } catch {
    // ignore
  }
  process.exit(1)
})

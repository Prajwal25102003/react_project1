import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'employee_management',
})

export async function query(text, params) {
  return pool.query(text, params)
}

export async function connectDatabase() {
  const result = await pool.query(
    'SELECT current_database() AS database, current_user AS user',
  )
  return result.rows[0]
}

export default pool

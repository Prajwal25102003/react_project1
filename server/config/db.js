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
  // Keep low so local tools (pgAdmin, MCP) still have room under max_connections.
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  application_name: process.env.DB_APP_NAME || 'ems-api',
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

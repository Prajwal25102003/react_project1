import { query } from '../config/db.js'

export async function getDatabaseStatus() {
  const result = await query(
    'SELECT current_database() AS database, current_user AS "user"',
  )
  const row = result.rows[0]

  return {
    connected: true,
    database: row.database,
    user: row.user,
  }
}

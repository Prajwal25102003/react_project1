import { query } from '../config/db.js'

export async function getDatabaseStatus() {
  await query('SELECT 1')
  return {
    connected: true,
  }
}

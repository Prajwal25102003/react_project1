import { testConnection } from '../config/db.js'

export async function getDatabaseStatus() {
  const info = await testConnection()
  return {
    connected: true,
    database: info.database,
    user: info.user,
  }
}

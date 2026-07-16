import { query } from '../config/db.js'
import { findEmployeeActivityRows } from './dashboardModel.js'

export async function findNotificationsForOrg(limit = 10) {
  const result = await query(
    `SELECT
      id,
      title,
      description,
      category,
      activity_time AS "activityTime",
      status
    FROM recent_activities
    ORDER BY activity_time DESC
    LIMIT $1`,
    [limit],
  )

  return result.rows
}

export async function findNotificationsForEmployee(employeeId, limit = 10) {
  return findEmployeeActivityRows(employeeId, limit)
}

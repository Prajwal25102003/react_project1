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

/** Org-wide holiday calendar changes (add / edit / delete / release). */
export async function findHolidayActivityRows(limit = 10) {
  const result = await query(
    `SELECT
      id,
      title,
      description,
      category,
      activity_time AS "activityTime",
      status
    FROM recent_activities
    WHERE category = 'Holidays'
    ORDER BY activity_time DESC
    LIMIT $1`,
    [limit],
  )

  return result.rows
}

function mergeActivityFeeds(primaryRows, secondaryRows, limit) {
  const seen = new Set()
  const merged = []

  for (const row of [...(primaryRows || []), ...(secondaryRows || [])]) {
    const id = String(row.id)
    if (seen.has(id)) continue
    seen.add(id)
    merged.push(row)
  }

  merged.sort((a, b) => {
    const ta = new Date(a.activityTime || 0).getTime()
    const tb = new Date(b.activityTime || 0).getTime()
    return tb - ta
  })

  return merged.slice(0, limit)
}

/**
 * Personal attendance/leave plus holiday calendar changes so employees
 * get Holidays sidebar badges and see what admin changed.
 */
export async function findNotificationsForEmployee(employeeId, limit = 10) {
  const [personalRows, holidayRows] = await Promise.all([
    findEmployeeActivityRows(employeeId, limit),
    findHolidayActivityRows(limit),
  ])

  return mergeActivityFeeds(
    personalRows,
    (holidayRows || []).map((row) => ({ ...row, audience: 'org' })),
    limit,
  )
}

import {
  findEmployeeActivityRows,
  findTeamActivityRows,
} from './dashboardModel.js'
import { query } from '../config/db.js'

export async function findNotificationsForOrg(limit = 10) {
  const result = await query(
    `SELECT
      id,
      title,
      description,
      category,
      activity_time AS "activityTime",
      status,
      event_type AS "eventType",
      subject_employee_id AS "subjectEmployeeId",
      actor_employee_id AS "actorEmployeeId",
      meta
    FROM recent_activities
    ORDER BY activity_time DESC
    LIMIT $1`,
    [limit],
  )

  return result.rows
}

/** Org feed for Admin: modules + HR leave only (not all employee leave). */
export async function findNotificationsForAdmin(limit = 10) {
  const result = await query(
    `SELECT
      id,
      title,
      description,
      category,
      activity_time AS "activityTime",
      status,
      event_type AS "eventType",
      subject_employee_id AS "subjectEmployeeId",
      actor_employee_id AS "actorEmployeeId",
      meta
    FROM recent_activities
    WHERE category <> 'Leave'
       OR (
         category = 'Leave'
         AND subject_employee_id IS NOT NULL
         AND EXISTS (
           SELECT 1
           FROM users u
           WHERE u.employee_id = recent_activities.subject_employee_id
             AND u.role = 'hr'
         )
       )
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
      status,
      event_type AS "eventType",
      subject_employee_id AS "subjectEmployeeId",
      actor_employee_id AS "actorEmployeeId",
      meta
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

function withSelfOrTeamAudience(rows, viewerEmployeeId) {
  return (rows || []).map((row) => {
    const isSelf =
      viewerEmployeeId &&
      String(row.subjectEmployeeId || '') === String(viewerEmployeeId)
    return {
      ...row,
      audience: isSelf ? 'self' : 'org',
    }
  })
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
    withSelfOrTeamAudience(personalRows, employeeId),
    (holidayRows || []).map((row) => ({ ...row, audience: 'org' })),
    limit,
  )
}

/**
 * Team lead: own + department employees' attendance/leave, plus holidays.
 */
export async function findNotificationsForTeamLead(headEmployeeId, limit = 15) {
  const [teamRows, holidayRows] = await Promise.all([
    findTeamActivityRows(headEmployeeId, limit),
    findHolidayActivityRows(limit),
  ])

  return mergeActivityFeeds(
    withSelfOrTeamAudience(teamRows, headEmployeeId),
    (holidayRows || []).map((row) => ({ ...row, audience: 'org' })),
    limit,
  )
}

import {
  findEmployeeActivityRows,
  findTeamActivityRows,
  findTeamEmployeeIds,
} from './dashboardModel.js'
import { isEmployeeDepartmentHead } from './departmentsModel.js'
import { isNamedLeaveApprover } from './leaveApprovalHierarchyModel.js'
import {
  findLeaveRequestsAwaitingActor,
  findLeaveRequestsWhereActorIsFutureStep,
} from './leaveRequestsModel.js'
import { query } from '../config/db.js'
import { filterAttendanceForEmployeeFeed } from '../utils/notificationAudience.js'

const DEFAULT_FEED_LIMIT = 25

const ACTIVITY_SELECT = `
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
`

export async function findNotificationsForOrg(limit = DEFAULT_FEED_LIMIT) {
  const result = await query(
    `SELECT ${ACTIVITY_SELECT}
    FROM recent_activities
    ORDER BY activity_time DESC
    LIMIT $1`,
    [limit],
  )

  return result.rows
}

/**
 * Org feed for Admin: same as org-wide feed so the leave approval stepper
 * is fully visible (submit → forward → approve/reject) for every employee,
 * plus all module activities.
 */
export async function findNotificationsForAdmin(limit = DEFAULT_FEED_LIMIT) {
  return findNotificationsForOrg(limit)
}

/** Org-wide holiday calendar changes (add / edit / delete / release). */
export async function findHolidayActivityRows(limit = 10) {
  const result = await query(
    `SELECT ${ACTIVITY_SELECT}
    FROM recent_activities
    WHERE category = 'Holidays'
    ORDER BY activity_time DESC
    LIMIT $1`,
    [limit],
  )

  return result.rows
}

function parseMeta(meta) {
  if (!meta) return {}
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta) || {}
    } catch {
      return {}
    }
  }
  return meta
}

function leaveRequestKey(row) {
  const meta = parseMeta(row.meta)
  if (meta.leaveRequestId) return String(meta.leaveRequestId)
  const match = String(row.id || '').match(/^leave-(.+)$/i)
  return match ? match[1] : null
}

function isLeaveFeedRow(row) {
  return (
    String(row?.category || '') === 'Leave' ||
    String(row?.eventType || '').startsWith('leave.')
  )
}

/**
 * Merge feeds by id. For the same leave request, keep only the newest row
 * (prefer real recent_activities over synthetic leave-{id} rows).
 *
 * Default: sliding window of `limit` newest messages — older ones drop out
 * as newer ones fill the slots.
 *
 * When reservePersonalLeave is set, keep personal Leave rows in the feed even
 * if older holiday announcements would otherwise push them out of the limit.
 */
export function mergeActivityFeeds(
  rowGroups,
  limit,
  { reservePersonalLeave = false } = {},
) {
  const byId = new Map()
  const leaveBest = new Map()

  for (const rows of rowGroups) {
    for (const row of rows || []) {
      const leaveKey = isLeaveFeedRow(row) ? leaveRequestKey(row) : null
      if (leaveKey) {
        const existing = leaveBest.get(leaveKey)
        if (!existing) {
          leaveBest.set(leaveKey, row)
          continue
        }
        const rowSynthetic = String(row.id || '').startsWith('leave-')
        const existingSynthetic = String(existing.id || '').startsWith('leave-')
        const rowTime = new Date(row.activityTime || 0).getTime()
        const existingTime = new Date(existing.activityTime || 0).getTime()
        // Always prefer the newer timestamp so forwards replace older submit rows.
        if (rowTime !== existingTime) {
          if (rowTime > existingTime) leaveBest.set(leaveKey, row)
          continue
        }
        if (existingSynthetic && !rowSynthetic) {
          leaveBest.set(leaveKey, row)
        } else if (!existingSynthetic && rowSynthetic) {
          // keep recorded decision activity
        }
        continue
      }

      const id = String(row.id)
      if (!byId.has(id)) byId.set(id, row)
    }
  }

  const merged = [...byId.values(), ...leaveBest.values()]
  merged.sort((a, b) => {
    const ta = new Date(a.activityTime || 0).getTime()
    const tb = new Date(b.activityTime || 0).getTime()
    return tb - ta
  })

  // Sliding window: newest `limit` only — older messages leave the feed.
  if (!reservePersonalLeave) {
    return merged.slice(0, limit)
  }

  const personalLeave = merged.filter(
    (row) =>
      isLeaveFeedRow(row) &&
      String(row.audience || '').toLowerCase() === 'self',
  )
  const rest = merged.filter(
    (row) =>
      !(
        isLeaveFeedRow(row) &&
        String(row.audience || '').toLowerCase() === 'self'
      ),
  )
  const leaveSlots = Math.min(
    personalLeave.length,
    Math.max(3, Math.ceil(limit / 2)),
  )
  const selected = [
    ...personalLeave.slice(0, leaveSlots),
    ...rest.slice(0, Math.max(0, limit - leaveSlots)),
  ]
  selected.sort((a, b) => {
    const ta = new Date(a.activityTime || 0).getTime()
    const tb = new Date(b.activityTime || 0).getTime()
    return tb - ta
  })
  return selected.slice(0, limit)
}

export function withSelfOrTeamAudience(rows, viewerEmployeeId) {
  return (rows || []).map((row) => {
    const meta = parseMeta(row.meta)
    const inEmployeeIds = Array.isArray(meta.employeeIds)
      ? meta.employeeIds.some(
          (id) => String(id) === String(viewerEmployeeId || ''),
        )
      : false
    const isSelf =
      Boolean(viewerEmployeeId) &&
      (String(row.subjectEmployeeId || '') === String(viewerEmployeeId) ||
        inEmployeeIds)
    return {
      ...row,
      audience: isSelf ? 'self' : 'org',
    }
  })
}

/** Leave decision/submit activities from recent_activities for these employees. */
export async function findLeaveDecisionActivityRows(employeeIds, limit = 10) {
  const ids = [...new Set((employeeIds || []).filter(Boolean))]
  if (ids.length === 0) return []

  const result = await query(
    `SELECT ${ACTIVITY_SELECT}
    FROM recent_activities
    WHERE category = 'Leave'
      AND subject_employee_id = ANY($1::varchar[])
    ORDER BY activity_time DESC
    LIMIT $2`,
    [ids, limit],
  )

  return result.rows
}

/**
 * Newest activity per leave request id, then the top `limit` by time.
 * Older leave messages drop out of the sliding window as newer ones arrive.
 */
export async function findLeaveActivityRowsForLeaveIds(leaveIds, limit = 25) {
  const ids = [...new Set((leaveIds || []).filter(Boolean).map(String))]
  if (ids.length === 0) return []

  const result = await query(
    `SELECT
      id,
      title,
      description,
      category,
      "activityTime",
      status,
      "eventType",
      "subjectEmployeeId",
      "actorEmployeeId",
      meta
    FROM (
      SELECT DISTINCT ON (meta->>'leaveRequestId')
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
      WHERE category = 'Leave'
        AND meta->>'leaveRequestId' = ANY($1::varchar[])
      ORDER BY meta->>'leaveRequestId', activity_time DESC
    ) latest
    ORDER BY "activityTime" DESC
    LIMIT $2`,
    [ids, limit],
  )

  return result.rows
}

/**
 * Module notices aimed at one or more employees:
 * - subject_employee_id match
 * - meta.employeeIds contains any of them
 * - Departments: departmentId / departmentIds matches viewers' departments
 * - Attendance: departmentId / departmentIds matches only when a viewer is
 *   that department's head (team lead), so peers do not see each other's rows
 */
export async function findPersonalSubjectActivityRows(employeeIds, limit = 10) {
  const ids = [
    ...new Set(
      (Array.isArray(employeeIds) ? employeeIds : [employeeIds]).filter(Boolean),
    ),
  ]
  if (ids.length === 0) return []

  const result = await query(
    `SELECT ${ACTIVITY_SELECT}
    FROM recent_activities
    WHERE category IN ('Employees', 'Departments', 'Attendance', 'Leave')
      AND (
        subject_employee_id = ANY($1::varchar[])
        OR (
          meta IS NOT NULL
          AND jsonb_typeof(meta->'employeeIds') = 'array'
          AND meta->'employeeIds' ?| $1::text[]
        )
        OR (
          -- Whole-department notices for Department events (all members).
          category = 'Departments'
          AND meta IS NOT NULL
          AND meta->>'departmentId' IS NOT NULL
          AND meta->>'departmentId' IN (
            SELECT e.department_id
            FROM employees e
            WHERE e.id = ANY($1::varchar[])
              AND e.department_id IS NOT NULL
          )
        )
        OR (
          category = 'Departments'
          AND meta IS NOT NULL
          AND jsonb_typeof(meta->'departmentIds') = 'array'
          AND EXISTS (
            SELECT 1
            FROM employees e
            WHERE e.id = ANY($1::varchar[])
              AND e.department_id IS NOT NULL
              AND meta->'departmentIds' ? e.department_id
          )
        )
        OR (
          -- Attendance: only the department head receives dept-scoped notices.
          category = 'Attendance'
          AND meta IS NOT NULL
          AND meta->>'departmentId' IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM departments d
            WHERE d.id = meta->>'departmentId'
              AND d.head_employee_id = ANY($1::varchar[])
          )
        )
        OR (
          category = 'Attendance'
          AND meta IS NOT NULL
          AND jsonb_typeof(meta->'departmentIds') = 'array'
          AND EXISTS (
            SELECT 1
            FROM departments d
            WHERE d.head_employee_id = ANY($1::varchar[])
              AND meta->'departmentIds' ? d.id
          )
        )
      )
    ORDER BY activity_time DESC
    LIMIT $2`,
    [ids, limit],
  )

  return result.rows
}

/**
 * Personal attendance/leave plus holiday calendar changes so employees
 * get Holidays sidebar badges and see what admin changed.
 */
export async function findNotificationsForEmployee(
  employeeId,
  limit = DEFAULT_FEED_LIMIT,
) {
  const [personalRows, holidayRows, leaveDecisionRows, subjectRows] =
    await Promise.all([
      findEmployeeActivityRows(employeeId, limit),
      findHolidayActivityRows(limit),
      findLeaveDecisionActivityRows([employeeId], limit),
      findPersonalSubjectActivityRows(employeeId, limit),
    ])

  // Attendance: employee sees only their own mark/remove (not bulk imports).
  const scopedSubjectRows = filterAttendanceForEmployeeFeed(
    subjectRows,
    employeeId,
  )

  return mergeActivityFeeds(
    [
      withSelfOrTeamAudience(leaveDecisionRows, employeeId),
      withSelfOrTeamAudience(scopedSubjectRows, employeeId),
      withSelfOrTeamAudience(personalRows, employeeId),
      (holidayRows || []).map((row) => ({ ...row, audience: 'org' })),
    ],
    limit,
    { reservePersonalLeave: true },
  )
}

/**
 * Team lead: own + department employees' attendance/leave, plus holidays.
 */
export async function findNotificationsForTeamLead(
  headEmployeeId,
  limit = DEFAULT_FEED_LIMIT,
) {
  const teamIds = await findTeamEmployeeIds(headEmployeeId)
  const subjectIds = [...new Set([headEmployeeId, ...(teamIds || [])])]

  const [teamRows, holidayRows, leaveDecisionRows, subjectRows] =
    await Promise.all([
      findTeamActivityRows(headEmployeeId, limit),
      findHolidayActivityRows(limit),
      findLeaveDecisionActivityRows(subjectIds, limit),
      // Include team subjects so heads see hire/profile/attendance/dept notices.
      findPersonalSubjectActivityRows(subjectIds, limit),
    ])

  return mergeActivityFeeds(
    [
      withSelfOrTeamAudience(leaveDecisionRows, headEmployeeId),
      withSelfOrTeamAudience(subjectRows, headEmployeeId),
      withSelfOrTeamAudience(teamRows, headEmployeeId),
      (holidayRows || []).map((row) => ({ ...row, audience: 'org' })),
    ],
    limit,
    { reservePersonalLeave: true },
  )
}

function withAudience(rows, audience) {
  return (rows || []).map((row) => ({
    ...row,
    audience: row.audience || audience,
  }))
}

/**
 * Activities for leaves where this actor is current OR later in the chain.
 * Current → Approval Needed; future → Awaiting Approval (personalized at map time).
 */
export async function findChainApproverLeaveActivities(
  { role = null, employeeId = null },
  limit = DEFAULT_FEED_LIMIT,
) {
  const [awaiting, future] = await Promise.all([
    findLeaveRequestsAwaitingActor({ role, employeeId }),
    findLeaveRequestsWhereActorIsFutureStep({ role, employeeId }),
  ])
  const awaitingIds = [
    ...new Set(
      (awaiting || [])
        .map((row) => row.id)
        .filter(Boolean)
        .map(String),
    ),
  ]
  const futureIds = [
    ...new Set(
      (future || [])
        .map((row) => row.id)
        .filter(Boolean)
        .map(String)
        .filter((id) => !awaitingIds.includes(id)),
    ),
  ]
  if (awaitingIds.length === 0 && futureIds.length === 0) return []

  const [awaitingRows, futureRows] = await Promise.all([
    findLeaveActivityRowsForLeaveIds(
      awaitingIds,
      Math.max(limit, awaitingIds.length),
    ),
    findLeaveActivityRowsForLeaveIds(futureIds, limit),
  ])
  return [...(awaitingRows || []), ...(futureRows || [])]
}

/**
 * Role-aware activity/notification feed used by both /api/notifications
 * and dashboard recent activities.
 * @returns {{ rows: object[], viewer: object }}
 */
export async function buildActivityFeedForViewer(
  user,
  { limit = DEFAULT_FEED_LIMIT } = {},
) {
  const role = user?.role
  const employeeId = user?.employeeId || null

  if (role === 'employee') {
    if (!employeeId) {
      const error = new Error(
        'Your account is not linked to an employee record',
      )
      error.status = 403
      throw error
    }

    const [isTeamLead, namedApprover] = await Promise.all([
      isEmployeeDepartmentHead(employeeId),
      isNamedLeaveApprover(employeeId),
    ])

    const baseRows = isTeamLead
      ? await findNotificationsForTeamLead(employeeId, limit)
      : await findNotificationsForEmployee(employeeId, limit)

    let chainRows = []
    if (namedApprover || isTeamLead) {
      chainRows = await findChainApproverLeaveActivities(
        { employeeId },
        limit,
      )
    }

    const rows = mergeActivityFeeds(
      [withAudience(chainRows, 'org'), baseRows],
      limit,
      { reservePersonalLeave: true },
    )

    return {
      rows,
      viewer: {
        employeeId,
        role,
        name: user?.name || null,
        isDepartmentHead: isTeamLead,
      },
    }
  }

  if (role === 'admin') {
    const [orgRows, chainRows] = await Promise.all([
      findNotificationsForAdmin(limit),
      findChainApproverLeaveActivities(
        { role: 'admin', employeeId },
        limit,
      ),
    ])
    return {
      rows: mergeActivityFeeds(
        [withAudience(chainRows, 'org'), withAudience(orgRows, 'org')],
        limit,
      ),
      viewer: {
        employeeId,
        role,
        name: user?.name || null,
      },
    }
  }

  if (role === 'hr') {
    const [orgRows, chainRows] = await Promise.all([
      findNotificationsForOrg(limit),
      findChainApproverLeaveActivities({ role: 'hr', employeeId }, limit),
    ])

    let rows
    if (employeeId) {
      const personalRows = await findNotificationsForEmployee(
        employeeId,
        limit,
      )
      rows = mergeActivityFeeds(
        [
          withAudience(chainRows, 'org'),
          withAudience(personalRows, 'self'),
          withAudience(orgRows, 'org'),
        ],
        limit,
        { reservePersonalLeave: true },
      )
    } else {
      rows = mergeActivityFeeds(
        [withAudience(chainRows, 'org'), withAudience(orgRows, 'org')],
        limit,
      )
    }

    return {
      rows,
      viewer: {
        employeeId,
        role,
        name: user?.name || null,
      },
    }
  }

  const error = new Error('Unauthorized')
  error.status = 403
  throw error
}

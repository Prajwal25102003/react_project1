import { isEmployeeDepartmentHead } from '../models/departmentsModel.js'
import { isNamedLeaveApprover } from '../models/leaveApprovalHierarchyModel.js'
import {
  findLeaveRequestsAwaitingActor,
  findLeaveRequestsWhereActorIsFutureStep,
} from '../models/leaveRequestsModel.js'
import {
  findLeaveActivityRowsForLeaveIds,
  findNotificationsForAdmin,
  findNotificationsForEmployee,
  findNotificationsForOrg,
  findNotificationsForTeamLead,
  mergeActivityFeeds,
} from '../models/notificationsModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import { mapActivityRowsAsync } from '../utils/relativeTime.js'

const NOTIFICATION_FEED_LIMIT = 25

function withAudience(rows, audience) {
  return (rows || []).map((row) => ({
    ...row,
    audience: row.audience || audience,
  }))
}

function sortNewestFirst(rows) {
  return [...(rows || [])].sort((a, b) => {
    const tb = new Date(b.activityTime || 0).getTime()
    const ta = new Date(a.activityTime || 0).getTime()
    return tb - ta
  })
}

/**
 * Activities for leaves where this actor is current OR later in the chain.
 * Current → Approval Needed; future → Awaiting Approval (personalized at map time).
 */
async function findChainApproverLeaveActivities(
  { role = null, employeeId = null },
  limit = NOTIFICATION_FEED_LIMIT,
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

  // Latest activity per leave, then merge/sort into the feed window.
  const [awaitingRows, futureRows] = await Promise.all([
    findLeaveActivityRowsForLeaveIds(
      awaitingIds,
      Math.max(limit, awaitingIds.length),
    ),
    findLeaveActivityRowsForLeaveIds(futureIds, limit),
  ])
  return [...(awaitingRows || []), ...(futureRows || [])]
}

export async function getNotifications(req, res) {
  try {
    const role = req.user?.role
    let rows = []

    if (role === 'employee') {
      if (!req.user.employeeId) {
        return res.status(403).json({
          message: 'Your account is not linked to an employee record',
        })
      }

      const employeeId = req.user.employeeId
      const [isTeamLead, namedApprover] = await Promise.all([
        isEmployeeDepartmentHead(employeeId),
        isNamedLeaveApprover(employeeId),
      ])

      const baseRows = isTeamLead
        ? await findNotificationsForTeamLead(
            employeeId,
            NOTIFICATION_FEED_LIMIT,
          )
        : await findNotificationsForEmployee(
            employeeId,
            NOTIFICATION_FEED_LIMIT,
          )

      let chainRows = []
      if (namedApprover || isTeamLead) {
        chainRows = await findChainApproverLeaveActivities(
          { employeeId },
          NOTIFICATION_FEED_LIMIT,
        )
      }

      rows = mergeActivityFeeds(
        [withAudience(chainRows, 'org'), baseRows],
        NOTIFICATION_FEED_LIMIT,
        { reservePersonalLeave: true },
      )

      const viewer = {
        employeeId,
        role: req.user?.role || null,
        name: req.user?.name || null,
        isDepartmentHead: isTeamLead,
      }
      const notifications = await mapActivityRowsAsync(
        sortNewestFirst(rows),
        viewer,
      )
      return res.json({ notifications })
    } else if (role === 'admin') {
      const orgRows = withAudience(
        await findNotificationsForAdmin(NOTIFICATION_FEED_LIMIT),
        'org',
      )
      const chainRows = await findChainApproverLeaveActivities(
        { role: 'admin', employeeId: req.user?.employeeId || null },
        NOTIFICATION_FEED_LIMIT,
      )
      rows = mergeActivityFeeds(
        [withAudience(chainRows, 'org'), orgRows],
        NOTIFICATION_FEED_LIMIT,
      )
    } else if (role === 'hr') {
      const orgRows = await findNotificationsForOrg(NOTIFICATION_FEED_LIMIT)
      const chainRows = await findChainApproverLeaveActivities(
        { role: 'hr', employeeId: req.user?.employeeId || null },
        NOTIFICATION_FEED_LIMIT,
      )
      if (req.user.employeeId) {
        const personalRows = await findNotificationsForEmployee(
          req.user.employeeId,
          NOTIFICATION_FEED_LIMIT,
        )
        rows = mergeActivityFeeds(
          [
            withAudience(chainRows, 'org'),
            withAudience(personalRows, 'self'),
            withAudience(orgRows, 'org'),
          ],
          NOTIFICATION_FEED_LIMIT,
          { reservePersonalLeave: true },
        )
      } else {
        rows = mergeActivityFeeds(
          [withAudience(chainRows, 'org'), withAudience(orgRows, 'org')],
          NOTIFICATION_FEED_LIMIT,
        )
      }
    } else {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const viewer = {
      employeeId: req.user?.employeeId || null,
      role: req.user?.role || null,
      name: req.user?.name || null,
    }
    // Newest at top — older messages follow below.
    const notifications = await mapActivityRowsAsync(
      sortNewestFirst(rows),
      viewer,
    )

    res.json({ notifications })
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

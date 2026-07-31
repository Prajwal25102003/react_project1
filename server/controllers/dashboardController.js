import {
  findRecentActivities,
  findTeamEmployeeIds,
  getDashboardStats,
  getDepartmentBreakdown,
  getEmployeeDashboardStats,
  getEmployeeRecentActivities,
  getTeamRecentActivities,
  normalizeNewEmployeesPeriod,
} from '../models/dashboardModel.js'
import { isEmployeeDepartmentHead } from '../models/departmentsModel.js'
import { isNamedLeaveApprover } from '../models/leaveApprovalHierarchyModel.js'
import {
  findLeaveRequestsAwaitingActor,
  findLeaveRequestsForAdminApprovals,
  findLeaveRequestsWhereActorIsFutureStep,
} from '../models/leaveRequestsModel.js'
import {
  findHolidayActivityRows,
  findLeaveActivityRowsForLeaveIds,
  findLeaveDecisionActivityRows,
  findNotificationsForAdmin,
  findPersonalSubjectActivityRows,
  mergeActivityFeeds,
} from '../models/notificationsModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import { mapActivityRowsAsync } from '../utils/relativeTime.js'

const PERIOD_LABELS = {
  month: 'this month',
  quarter: 'this quarter',
  year: 'this year',
}

const RECENT_ACTIVITY_LIMIT = 25

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

function mergeScopedWithHolidays(
  scopedRows,
  holidayRows,
  viewerEmployeeId,
  limit = RECENT_ACTIVITY_LIMIT,
  leaveDecisionRows = [],
) {
  const byId = new Map()
  const leaveBest = new Map()

  const pushRow = (row, audience) => {
    const withAudience = { ...row, audience: row.audience || audience }
    const leaveKey = isLeaveFeedRow(withAudience)
      ? leaveRequestKey(withAudience)
      : null
    if (leaveKey) {
      const existing = leaveBest.get(leaveKey)
      if (!existing) {
        leaveBest.set(leaveKey, withAudience)
        return
      }
      const rowSynthetic = String(withAudience.id || '').startsWith('leave-')
      const existingSynthetic = String(existing.id || '').startsWith('leave-')
      const rowTime = new Date(withAudience.activityTime || 0).getTime()
      const existingTime = new Date(existing.activityTime || 0).getTime()
        if (existingSynthetic && !rowSynthetic) {
          leaveBest.set(leaveKey, withAudience)
        } else if (rowSynthetic && !existingSynthetic) {
          // keep recorded decision activity
        } else if (rowTime >= existingTime) {
          leaveBest.set(leaveKey, withAudience)
        }
      return
    }
    const id = String(withAudience.id)
    if (!byId.has(id)) byId.set(id, withAudience)
  }

  for (const row of leaveDecisionRows || []) {
    const isSelf =
      viewerEmployeeId &&
      String(row.subjectEmployeeId || '') === String(viewerEmployeeId)
    pushRow(row, isSelf ? 'self' : 'org')
  }

  for (const row of scopedRows || []) {
    const isSelf =
      viewerEmployeeId &&
      String(row.subjectEmployeeId || '') === String(viewerEmployeeId)
    pushRow(row, isSelf ? 'self' : 'org')
  }

  for (const row of holidayRows || []) {
    pushRow(row, 'org')
  }

  const merged = [...byId.values(), ...leaveBest.values()]
  merged.sort((a, b) => {
    const ta = new Date(a.activityTime || 0).getTime()
    const tb = new Date(b.activityTime || 0).getTime()
    return tb - ta
  })

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

async function findAwaitingApproverLeaveActivities(
  { role = null, employeeId = null },
  limit = RECENT_ACTIVITY_LIMIT,
) {
  const [awaiting, future] = await Promise.all([
    findLeaveRequestsAwaitingActor({ role, employeeId }),
    findLeaveRequestsWhereActorIsFutureStep({ role, employeeId }),
  ])
  const leaveIds = [
    ...new Set(
      [...(awaiting || []), ...(future || [])]
        .map((row) => row.id)
        .filter(Boolean)
        .map(String),
    ),
  ]
  if (leaveIds.length === 0) return []
  return findLeaveActivityRowsForLeaveIds(leaveIds, limit)
}

function buildOrgPrimaryMetrics(stats, periodLabel, period = 'month', { includeLeave = true, leaveLabel = 'Pending Leave', leaveHref = '/leave-requests?status=Pending' } = {}) {
  const total = stats.totalEmployees || 0
  const active = stats.activeEmployees || 0
  const inactive = stats.inactiveEmployees || 0
  const activeRate =
    total > 0 ? Number(((active / total) * 100).toFixed(1)) : 0
  const inactiveRate =
    total > 0 ? Number(((inactive / total) * 100).toFixed(1)) : 0
  const pendingLeave = stats.pendingLeaveRequests || 0
  const hiredPeriod = normalizeNewEmployeesPeriod(period)

  const metrics = [
    {
      id: 'total-employees',
      label: 'Total Employees',
      value: String(total),
      trend: `${stats.newEmployees} new ${periodLabel}`,
      trendUp: stats.newEmployees > 0,
      href: '/employees',
    },
    {
      id: 'active-employees',
      label: 'Active Employees',
      value: String(active),
      trend: `${activeRate}% active`,
      trendUp: activeRate >= 80,
      href: '/employees?status=Active',
    },
    {
      id: 'inactive-employees',
      label: 'Inactive Employees',
      value: String(inactive),
      trend: `${inactiveRate}% inactive`,
      trendUp: inactive === 0,
      href: '/employees?status=Inactive',
    },
    {
      id: 'new-employees',
      label: 'New Hires',
      value: String(stats.newEmployees),
      trend: periodLabel,
      trendUp: stats.newEmployees > 0,
      href: `/employees?hiredPeriod=${hiredPeriod}`,
    },
  ]

  if (includeLeave) {
    metrics.push({
      id: 'pending-leave',
      label: leaveLabel,
      value: String(pendingLeave),
      trend: pendingLeave > 0 ? 'needs review' : 'all clear',
      trendUp: pendingLeave === 0,
      href: leaveHref,
    })
  }

  return metrics
}

async function buildOrgDashboard(req, res) {
  const newEmployeesPeriod = normalizeNewEmployeesPeriod(
    req.query.newEmployeesPeriod,
  )
  const periodLabel = PERIOD_LABELS[newEmployeesPeriod]
  const metricsOnly = String(req.query.scope || '') === 'metrics'
  const isAdminUser = req.user?.role === 'admin'
  const metricOptions = isAdminUser
    ? {
        includeLeave: true,
        leaveLabel: 'Pending HR Leave',
        leaveHref: '/leave-requests?status=Pending',
      }
    : { includeLeave: true }

  async function withRoleLeaveStats(baseStats) {
    if (!isAdminUser) return baseStats
    const hrLeave = await findLeaveRequestsForAdminApprovals()
    const pendingHrLeave = (hrLeave || []).filter(
      (row) => row.status === 'Pending',
    ).length
    return { ...baseStats, pendingLeaveRequests: pendingHrLeave }
  }

  if (metricsOnly) {
    const stats = await withRoleLeaveStats(
      await getDashboardStats(newEmployeesPeriod),
    )
    const primaryMetrics = buildOrgPrimaryMetrics(
      stats,
      periodLabel,
      newEmployeesPeriod,
      metricOptions,
    )
    return res.json({
      variant: 'org',
      metrics: primaryMetrics,
      primaryMetrics,
      newEmployeesPeriod,
    })
  }

  const [baseStats, rawActivityRows, departments] = await Promise.all([
    getDashboardStats(newEmployeesPeriod),
    isAdminUser
      ? findNotificationsForAdmin(RECENT_ACTIVITY_LIMIT)
      : findRecentActivities(),
    getDepartmentBreakdown(),
  ])

  const awaitingRows =
    isAdminUser || req.user?.role === 'hr'
      ? await findAwaitingApproverLeaveActivities(
          {
            role: isAdminUser ? 'admin' : 'hr',
            employeeId: req.user?.employeeId || null,
          },
          RECENT_ACTIVITY_LIMIT,
        )
      : []

  const activityRows = mergeActivityFeeds(
    [
      awaitingRows.map((row) => ({ ...row, audience: row.audience || 'org' })),
      (rawActivityRows || []).map((row) => ({
        ...row,
        audience: row.audience || 'org',
      })),
    ],
    RECENT_ACTIVITY_LIMIT,
  )

  const stats = await withRoleLeaveStats(baseStats)

  const primaryMetrics = buildOrgPrimaryMetrics(
    stats,
    periodLabel,
    newEmployeesPeriod,
    metricOptions,
  )

  const viewer = {
    employeeId: req.user?.employeeId || null,
    role: req.user?.role || null,
    name: req.user?.name || null,
  }

  const orderedActivities = [...(activityRows || [])].sort((a, b) => {
    const tb = new Date(b.activityTime || 0).getTime()
    const ta = new Date(a.activityTime || 0).getTime()
    return tb - ta
  })

  res.json({
    variant: 'org',
    metrics: primaryMetrics,
    primaryMetrics,
    activities: await mapActivityRowsAsync(orderedActivities, viewer),
    newEmployeesPeriod,
    departments,
  })
}

async function buildEmployeeDashboard(req, res) {
  const employeeId = req.user.employeeId
  if (!employeeId) {
    return res.status(403).json({
      message: 'Your account is not linked to an employee record',
    })
  }

  const isTeamLead = await isEmployeeDepartmentHead(employeeId)
  const namedApprover = await isNamedLeaveApprover(employeeId)
  const teamIds = isTeamLead ? await findTeamEmployeeIds(employeeId) : []
  const subjectIds = [...new Set([employeeId, ...(teamIds || [])])]

  const [stats, scopedRows, holidayRows, leaveDecisionRows, subjectRows, awaitingRows] =
    await Promise.all([
      getEmployeeDashboardStats(employeeId),
      isTeamLead
        ? getTeamRecentActivities(employeeId)
        : getEmployeeRecentActivities(employeeId),
      findHolidayActivityRows(RECENT_ACTIVITY_LIMIT),
      findLeaveDecisionActivityRows(subjectIds, RECENT_ACTIVITY_LIMIT),
      findPersonalSubjectActivityRows(employeeId, RECENT_ACTIVITY_LIMIT),
      namedApprover || isTeamLead
        ? findAwaitingApproverLeaveActivities(
            { employeeId },
            RECENT_ACTIVITY_LIMIT,
          )
        : Promise.resolve([]),
    ])

  const activityRows = mergeScopedWithHolidays(
    scopedRows,
    holidayRows,
    employeeId,
    RECENT_ACTIVITY_LIMIT,
    [
      ...(awaitingRows || []),
      ...(leaveDecisionRows || []),
      ...(subjectRows || []),
    ],
  )

  const marked = stats.attendanceMarkedMonth || 0
  const present = stats.daysPresentMonth || 0
  const attendanceRate =
    marked > 0 ? Number(((present / marked) * 100).toFixed(1)) : 0
  const onLeave = (stats.onLeaveToday || 0) > 0

  const primaryMetrics = [
    {
      id: 'days-present',
      label: 'Days Present',
      value: String(present),
      trend: 'this month',
      trendUp: present > 0,
    },
    {
      id: 'leave-approved',
      label: 'Leave Days Used',
      value: String(stats.leaveDaysApprovedYtd || 0),
      trend: 'this year',
      trendUp: true,
    },
    {
      id: 'pending-leave',
      label: 'Pending Leave',
      value: String(stats.pendingLeaveRequests || 0),
      trend: onLeave ? 'on leave today' : 'awaiting review',
      trendUp: (stats.pendingLeaveRequests || 0) === 0,
    },
  ]

  const casualLeft = stats.casualLeaveBalance ?? 0
  const sickLeft = stats.sickLeaveBalance ?? 0
  const totalAvailable = Number(casualLeft) + Number(sickLeft)

  const secondaryMetrics = [
    {
      id: 'total-leave',
      label: 'Leaves Available',
      value: String(totalAvailable),
      trend: 'casual + sick',
      trendUp: totalAvailable > 0,
    },
    {
      id: 'casual-leave',
      label: 'Casual Left',
      value: String(casualLeft),
      trend: 'paid quota',
      trendUp: casualLeft > 0,
    },
    {
      id: 'sick-leave',
      label: 'Sick Left',
      value: String(sickLeft),
      trend: 'paid quota',
      trendUp: sickLeft > 0,
    },
  ]

  const viewer = {
    employeeId: employeeId,
    role: req.user?.role || null,
    name: req.user?.name || null,
    isDepartmentHead: isTeamLead,
  }

  const orderedEmployeeActivities = [...(activityRows || [])].sort((a, b) => {
    const tb = new Date(b.activityTime || 0).getTime()
    const ta = new Date(a.activityTime || 0).getTime()
    return tb - ta
  })

  res.json({
    variant: 'employee',
    metrics: primaryMetrics,
    primaryMetrics,
    secondaryMetrics,
    activities: (
      await mapActivityRowsAsync(orderedEmployeeActivities, viewer)
    ).slice(0, RECENT_ACTIVITY_LIMIT),
    charts: {
      activeRate: attendanceRate,
      targetMeta: {
        badge: onLeave ? 'On leave today' : `${present} days present`,
        stats: [
          {
            id: 'absent',
            label: 'Absent',
            value: String(stats.daysAbsentMonth || 0),
            trend: (stats.daysAbsentMonth || 0) > 0 ? 'down' : 'up',
          },
          {
            id: 'upcoming',
            label: 'Upcoming',
            value: String(stats.upcomingLeaveCount || 0),
            trend: 'up',
          },
          {
            id: 'hours',
            label: 'Avg hrs',
            value: Number(stats.avgHoursMonth || 0).toFixed(1),
            trend: 'up',
          },
        ],
      },
    },
  })
}

export async function getDashboard(req, res) {
  try {
    if (req.user?.role === 'employee') {
      return await buildEmployeeDashboard(req, res)
    }
    return await buildOrgDashboard(req, res)
  } catch (error) {
    res.status(500).json({ message: formatDbError(error) })
  }
}

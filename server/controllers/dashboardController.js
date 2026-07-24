import {
  findRecentActivities,
  getDashboardStats,
  getDepartmentBreakdown,
  getEmployeeDashboardStats,
  getEmployeeRecentActivities,
  getTeamRecentActivities,
  normalizeNewEmployeesPeriod,
} from '../models/dashboardModel.js'
import { isEmployeeDepartmentHead } from '../models/departmentsModel.js'
import { findLeaveRequestsForAdminApprovals } from '../models/leaveRequestsModel.js'
import {
  findHolidayActivityRows,
  findNotificationsForAdmin,
} from '../models/notificationsModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import { mapActivityRows } from '../utils/relativeTime.js'

const PERIOD_LABELS = {
  month: 'this month',
  quarter: 'this quarter',
  year: 'this year',
}

function mergeScopedWithHolidays(
  scopedRows,
  holidayRows,
  viewerEmployeeId,
  limit = 10,
) {
  const seen = new Set()
  const merged = []

  for (const row of scopedRows || []) {
    const id = String(row.id)
    if (seen.has(id)) continue
    seen.add(id)
    const isSelf =
      viewerEmployeeId &&
      String(row.subjectEmployeeId || '') === String(viewerEmployeeId)
    merged.push({
      ...row,
      audience: isSelf ? 'self' : 'org',
    })
  }

  for (const row of holidayRows || []) {
    const id = String(row.id)
    if (seen.has(id)) continue
    seen.add(id)
    merged.push({ ...row, audience: 'org' })
  }

  merged.sort((a, b) => {
    const ta = new Date(a.activityTime || 0).getTime()
    const tb = new Date(b.activityTime || 0).getTime()
    return tb - ta
  })

  return merged.slice(0, limit)
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

  const [baseStats, activityRows, departments] = await Promise.all([
    getDashboardStats(newEmployeesPeriod),
    isAdminUser ? findNotificationsForAdmin(10) : findRecentActivities(),
    getDepartmentBreakdown(),
  ])

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

  res.json({
    variant: 'org',
    metrics: primaryMetrics,
    primaryMetrics,
    activities: mapActivityRows(activityRows, viewer),
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
  const [stats, scopedRows, holidayRows] = await Promise.all([
    getEmployeeDashboardStats(employeeId),
    isTeamLead
      ? getTeamRecentActivities(employeeId)
      : getEmployeeRecentActivities(employeeId),
    findHolidayActivityRows(10),
  ])

  const activityRows = mergeScopedWithHolidays(
    scopedRows,
    holidayRows,
    employeeId,
    isTeamLead ? 15 : 10,
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
  }

  res.json({
    variant: 'employee',
    metrics: primaryMetrics,
    primaryMetrics,
    secondaryMetrics,
    activities: mapActivityRows(activityRows, viewer).slice(0, 10),
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

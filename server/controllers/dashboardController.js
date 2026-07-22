import {
  findRecentActivities,
  getDashboardStats,
  getDepartmentBreakdown,
  getEmployeeDashboardStats,
  getEmployeeRecentActivities,
  normalizeNewEmployeesPeriod,
} from '../models/dashboardModel.js'
import { formatDbError } from '../utils/formatDbError.js'
import { mapActivityRows } from '../utils/relativeTime.js'

const PERIOD_LABELS = {
  month: 'this month',
  quarter: 'this quarter',
  year: 'this year',
}

function buildOrgPrimaryMetrics(stats, periodLabel, period = 'month') {
  const total = stats.totalEmployees || 0
  const active = stats.activeEmployees || 0
  const inactive = stats.inactiveEmployees || 0
  const activeRate =
    total > 0 ? Number(((active / total) * 100).toFixed(1)) : 0
  const inactiveRate =
    total > 0 ? Number(((inactive / total) * 100).toFixed(1)) : 0
  const pendingLeave = stats.pendingLeaveRequests || 0
  const hiredPeriod = normalizeNewEmployeesPeriod(period)

  return [
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
    {
      id: 'pending-leave',
      label: 'Pending Leave',
      value: String(pendingLeave),
      trend: pendingLeave > 0 ? 'needs review' : 'all clear',
      trendUp: pendingLeave === 0,
      href: '/leave-approvals?status=Pending',
    },
  ]
}

async function buildOrgDashboard(req, res) {
  const newEmployeesPeriod = normalizeNewEmployeesPeriod(
    req.query.newEmployeesPeriod,
  )
  const periodLabel = PERIOD_LABELS[newEmployeesPeriod]
  const metricsOnly = String(req.query.scope || '') === 'metrics'

  if (metricsOnly) {
    const stats = await getDashboardStats(newEmployeesPeriod)
    const primaryMetrics = buildOrgPrimaryMetrics(
      stats,
      periodLabel,
      newEmployeesPeriod,
    )
    return res.json({
      variant: 'org',
      metrics: primaryMetrics,
      primaryMetrics,
      newEmployeesPeriod,
    })
  }

  const [stats, activityRows, departments] = await Promise.all([
    getDashboardStats(newEmployeesPeriod),
    findRecentActivities(),
    getDepartmentBreakdown(),
  ])

  const primaryMetrics = buildOrgPrimaryMetrics(
    stats,
    periodLabel,
    newEmployeesPeriod,
  )

  res.json({
    variant: 'org',
    metrics: primaryMetrics,
    primaryMetrics,
    activities: mapActivityRows(activityRows),
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

  const [stats, activityRows] = await Promise.all([
    getEmployeeDashboardStats(employeeId),
    getEmployeeRecentActivities(employeeId),
  ])

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

  const secondaryMetrics = [
    {
      id: 'casual-leave',
      label: 'Casual Left',
      value: String(stats.casualLeaveBalance ?? 0),
      trend: 'paid quota',
      trendUp: (stats.casualLeaveBalance ?? 0) > 0,
    },
    {
      id: 'sick-leave',
      label: 'Sick Left',
      value: String(stats.sickLeaveBalance ?? 0),
      trend: 'paid quota',
      trendUp: (stats.sickLeaveBalance ?? 0) > 0,
    },
    {
      id: 'lop-days',
      label: 'LOP Days',
      value: String(stats.lopDays ?? 0),
      trend: (stats.lopDays ?? 0) > 0 ? 'loss of pay' : 'none',
      trendUp: (stats.lopDays ?? 0) === 0,
    },
  ]

  res.json({
    variant: 'employee',
    metrics: primaryMetrics,
    primaryMetrics,
    secondaryMetrics,
    activities: mapActivityRows(activityRows).slice(0, 10),
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

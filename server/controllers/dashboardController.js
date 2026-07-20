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

async function buildOrgDashboard(req, res) {
  const newEmployeesPeriod = normalizeNewEmployeesPeriod(
    req.query.newEmployeesPeriod,
  )
  const periodLabel = PERIOD_LABELS[newEmployeesPeriod]

  const [stats, activityRows, departments] = await Promise.all([
    getDashboardStats(newEmployeesPeriod),
    findRecentActivities(),
    getDepartmentBreakdown(),
  ])

  const total = stats.totalEmployees || 0
  const active = stats.activeEmployees || 0
  const activeRate =
    total > 0 ? Number(((active / total) * 100).toFixed(1)) : 0
  const presentToday = (stats.presentToday || 0)
  const onLeave = stats.employeesOnLeave || 0
  const pendingLeave = stats.pendingLeaveRequests || 0
  const absentToday = stats.absentToday || 0
  const unmarkedToday = stats.unmarkedToday || 0

  const primaryMetrics = [
    {
      id: 'total-employees',
      label: 'Total Employees',
      value: String(total),
      trend: `${stats.newEmployees} new ${periodLabel}`,
      trendUp: stats.newEmployees > 0,
    },
    {
      id: 'active-employees',
      label: 'Active Employees',
      value: String(active),
      trend: `${activeRate}% active`,
      trendUp: activeRate >= 80,
    },
    {
      id: 'new-employees',
      label: 'New Hires',
      value: String(stats.newEmployees),
      trend: periodLabel,
      trendUp: stats.newEmployees > 0,
    },
    {
      id: 'pending-leave',
      label: 'Pending Leave',
      value: String(pendingLeave),
      trend: pendingLeave > 0 ? 'needs review' : 'all clear',
      trendUp: pendingLeave === 0,
    },
    {
      id: 'present-today',
      label: 'Present Today',
      value: String(presentToday),
      trend: `${unmarkedToday} not marked`,
      trendUp: unmarkedToday === 0,
    },
    {
      id: 'on-leave',
      label: 'On Leave Today',
      value: String(onLeave),
      trend: onLeave > 0 ? 'approved leave' : 'none today',
      trendUp: onLeave === 0,
    },
  ]

  const secondaryMetrics = [
    {
      id: 'absent-today',
      label: 'Absent Today',
      value: String(absentToday),
      trend: absentToday > 0 ? 'marked absent' : 'none',
      trendUp: absentToday === 0,
    },
    {
      id: 'unmarked-today',
      label: 'Unmarked Today',
      value: String(unmarkedToday),
      trend: unmarkedToday > 0 ? 'needs marking' : 'complete',
      trendUp: unmarkedToday === 0,
    },
    {
      id: 'departments',
      label: 'Departments',
      value: String(stats.departments || 0),
      trend: 'active teams',
      trendUp: true,
    },
  ]

  res.json({
    variant: 'org',
    metrics: primaryMetrics,
    primaryMetrics,
    secondaryMetrics,
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

import { query } from '../config/db.js'

const NEW_EMPLOYEE_PERIODS = new Set(['month', 'quarter', 'year'])

export function normalizeNewEmployeesPeriod(period) {
  const value = String(period || 'month').toLowerCase()
  return NEW_EMPLOYEE_PERIODS.has(value) ? value : 'month'
}

export async function getDashboardStats(period = 'month') {
  const newEmployeesPeriod = normalizeNewEmployeesPeriod(period)

  const result = await query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM employees) AS "totalEmployees",
      (
        SELECT COUNT(*)::int
        FROM employees
        WHERE date_trunc($1, joining_date) = date_trunc($1, CURRENT_DATE)
      ) AS "newEmployees",
      (
        SELECT COUNT(*)::int
        FROM employees
        WHERE status = 'Active'
      ) AS "activeEmployees",
      (SELECT COUNT(*)::int FROM departments) AS "departments",
      (
        SELECT COUNT(DISTINCT employee_id)::int
        FROM leave_requests
        WHERE status = 'Approved'
          AND CURRENT_DATE BETWEEN start_date AND end_date
      ) AS "employeesOnLeave",
      (
        SELECT COUNT(*)::int
        FROM leave_requests
        WHERE status = 'Pending'
      ) AS "pendingLeaveRequests",
      (
        SELECT COUNT(*)::int
        FROM attendance
        WHERE attendance_date = CURRENT_DATE
          AND status IN ('Present', 'Half Day')
      ) AS "presentToday",
      (
        SELECT COUNT(*)::int
        FROM attendance
        WHERE attendance_date = CURRENT_DATE
          AND status = 'Absent'
      ) AS "absentToday",
      (
        SELECT COUNT(*)::int
        FROM employees e
        WHERE e.status = 'Active'
          AND NOT EXISTS (
            SELECT 1
            FROM attendance a
            WHERE a.employee_id = e.id
              AND a.attendance_date = CURRENT_DATE
          )
      ) AS "unmarkedToday"
  `,
    [newEmployeesPeriod],
  )

  return {
    ...result.rows[0],
    newEmployeesPeriod,
  }
}

export async function findRecentActivities() {
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
    LIMIT 10`,
  )

  return result.rows
}

export async function getDepartmentBreakdown() {
  const result = await query(
    `SELECT
      d.id,
      d.name,
      COUNT(e.id)::int AS "employeeCount"
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id
    GROUP BY d.id, d.name
    ORDER BY "employeeCount" DESC
    LIMIT 5`,
  )

  const total = result.rows.reduce((sum, row) => sum + row.employeeCount, 0) || 1

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    employees: `${row.employeeCount} Employees`,
    percent: Math.round((row.employeeCount / total) * 100),
  }))
}

/** Employee-scoped dashboard aggregates (attendance + leave only for this id). */
export async function getEmployeeDashboardStats(employeeId) {
  const result = await query(
    `
    SELECT
      (
        SELECT COUNT(*)::int
        FROM attendance
        WHERE employee_id = $1
          AND date_trunc('month', attendance_date) = date_trunc('month', CURRENT_DATE)
          AND status IN ('Present', 'Half Day')
      ) AS "daysPresentMonth",
      (
        SELECT COUNT(*)::int
        FROM attendance
        WHERE employee_id = $1
          AND date_trunc('month', attendance_date) = date_trunc('month', CURRENT_DATE)
          AND status = 'Absent'
      ) AS "daysAbsentMonth",
      (
        SELECT COUNT(*)::int
        FROM attendance
        WHERE employee_id = $1
          AND date_trunc('month', attendance_date) = date_trunc('month', CURRENT_DATE)
      ) AS "attendanceMarkedMonth",
      (
        SELECT COALESCE(ROUND(AVG(working_hours)::numeric, 2), 0)::float
        FROM attendance
        WHERE employee_id = $1
          AND date_trunc('month', attendance_date) = date_trunc('month', CURRENT_DATE)
          AND status IN ('Present', 'Half Day')
      ) AS "avgHoursMonth",
      (
        SELECT COALESCE(SUM(leave_days), 0)::int
        FROM leave_requests
        WHERE employee_id = $1
          AND status = 'Approved'
          AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      ) AS "leaveDaysApprovedYtd",
      (
        SELECT COUNT(*)::int
        FROM leave_requests
        WHERE employee_id = $1
          AND status = 'Pending'
      ) AS "pendingLeaveRequests",
      (
        SELECT COUNT(*)::int
        FROM leave_requests
        WHERE employee_id = $1
          AND status = 'Approved'
          AND CURRENT_DATE BETWEEN start_date AND end_date
      ) AS "onLeaveToday",
      (
        SELECT COUNT(*)::int
        FROM leave_requests
        WHERE employee_id = $1
          AND status = 'Approved'
          AND start_date > CURRENT_DATE
      ) AS "upcomingLeaveCount"
    `,
    [employeeId],
  )

  return result.rows[0]
}

export async function findEmployeeActivityRows(employeeId, limit = 10) {
  const result = await query(
    `
    SELECT *
    FROM (
      SELECT
        ('att-' || id) AS id,
        CASE status
          WHEN 'Absent' THEN 'Marked absent'
          WHEN 'Half Day' THEN 'Half day recorded'
          ELSE 'Attendance marked'
        END AS title,
        (status || ' on ' || TO_CHAR(attendance_date, 'YYYY-MM-DD')) AS description,
        'Attendance' AS category,
        (attendance_date::timestamp + TIME '12:00') AS "activityTime",
        CASE
          WHEN status = 'Absent' THEN 'Absent'
          WHEN status = 'Half Day' THEN 'Half Day'
          ELSE 'Present'
        END AS status
      FROM attendance
      WHERE employee_id = $1

      UNION ALL

      SELECT
        ('leave-' || id) AS id,
        CASE status
          WHEN 'Pending' THEN 'Leave request submitted'
          WHEN 'Approved' THEN 'Leave approved'
          WHEN 'Cancelled' THEN 'Leave request cancelled'
          ELSE 'Leave rejected'
        END AS title,
        (leave_type || ' · ' || TO_CHAR(start_date, 'YYYY-MM-DD') ||
          CASE WHEN end_date <> start_date
            THEN ' to ' || TO_CHAR(end_date, 'YYYY-MM-DD')
            ELSE ''
          END) AS description,
        'Leave' AS category,
        COALESCE(updated_at, created_at, start_date::timestamptz) AS "activityTime",
        CASE
          WHEN status = 'Pending' THEN 'Pending'
          WHEN status = 'Approved' THEN 'Approved'
          WHEN status = 'Rejected' THEN 'Rejected'
          WHEN status = 'Cancelled' THEN 'Cancelled'
          ELSE 'Pending'
        END AS status
      FROM leave_requests
      WHERE employee_id = $1
    ) activities
    ORDER BY "activityTime" DESC, id DESC
    LIMIT $2
    `,
    [employeeId, limit],
  )

  return result.rows
}

export async function getEmployeeRecentActivities(employeeId) {
  return findEmployeeActivityRows(employeeId, 10)
}


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
      e."totalEmployees",
      e."activeEmployees",
      e."inactiveEmployees",
      e."newEmployees",
      (
        SELECT COUNT(*)::int
        FROM leave_requests
        WHERE status = 'Pending'
      ) AS "pendingLeaveRequests"
    FROM (
      SELECT
        COUNT(*)::int AS "totalEmployees",
        COUNT(*) FILTER (WHERE status = 'Active')::int AS "activeEmployees",
        COUNT(*) FILTER (WHERE status = 'Inactive')::int AS "inactiveEmployees",
        COUNT(*) FILTER (
          WHERE date_trunc($1, joining_date) = date_trunc($1, CURRENT_DATE)
        )::int AS "newEmployees"
      FROM employees
    ) e
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
      status,
      event_type AS "eventType",
      subject_employee_id AS "subjectEmployeeId",
      actor_employee_id AS "actorEmployeeId",
      meta
    FROM recent_activities
    ORDER BY activity_time DESC
    LIMIT 15`,
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
    ORDER BY "employeeCount" DESC`,
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
        SELECT COALESCE(SUM(leave_days), 0)::float
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
      ) AS "upcomingLeaveCount",
      (
        SELECT casual_leave_balance::int
        FROM employees
        WHERE id = $1
      ) AS "casualLeaveBalance",
      (
        SELECT sick_leave_balance::int
        FROM employees
        WHERE id = $1
      ) AS "sickLeaveBalance",
      (
        SELECT lop_days::int
        FROM employees
        WHERE id = $1
      ) AS "lopDays"
    `,
    [employeeId],
  )

  return result.rows[0]
}

/** Employees in departments headed by this person (includes the head when in-dept). */
export async function findTeamEmployeeIds(headEmployeeId) {
  if (!headEmployeeId) return []
  const result = await query(
    `SELECT e.id
     FROM employees e
     INNER JOIN departments d ON d.id = e.department_id
     WHERE d.head_employee_id = $1`,
    [headEmployeeId],
  )
  const ids = result.rows.map((row) => row.id)
  if (!ids.includes(headEmployeeId)) ids.push(headEmployeeId)
  return ids
}

/**
 * Attendance + leave activity rows for one or more employees.
 * Meta includes subjectName / leaveType / range so copy can personalize per viewer.
 */
export async function findActivityRowsForEmployees(employeeIds, limit = 10) {
  const ids = [...new Set((employeeIds || []).filter(Boolean))]
  if (ids.length === 0) return []

  const result = await query(
    `
    SELECT *
    FROM (
      (
        SELECT
          ('att-' || a.id) AS id,
          CASE a.status
            WHEN 'Absent' THEN 'Marked Absent'
            WHEN 'Half Day' THEN 'Half Day Recorded'
            ELSE 'Attendance Marked'
          END AS title,
          CASE
            WHEN a.status = 'Absent' THEN
              e.name || ' was marked Absent on ' || TO_CHAR(a.attendance_date, 'DD Mon YYYY') || '.'
            WHEN a.check_in IS NOT NULL AND a.check_in <> '' AND a.check_in <> '—' THEN
              e.name || ' checked in at ' || a.check_in || '.'
            ELSE
              e.name || ' was marked ' || a.status || ' on ' || TO_CHAR(a.attendance_date, 'DD Mon YYYY') || '.'
          END AS description,
          'Attendance' AS category,
          (a.attendance_date::timestamp + TIME '12:00') AS "activityTime",
          CASE
            WHEN a.status = 'Absent' THEN 'Absent'
            WHEN a.status = 'Half Day' THEN 'Half Day'
            ELSE 'Present'
          END AS status,
          'attendance.marked'::varchar AS "eventType",
          a.employee_id AS "subjectEmployeeId",
          NULL::varchar AS "actorEmployeeId",
          jsonb_build_object(
            'subjectName', e.name,
            'attendanceDate', TO_CHAR(a.attendance_date, 'YYYY-MM-DD'),
            'attendanceStatus', a.status,
            'checkIn', a.check_in
          ) AS meta
        FROM attendance a
        INNER JOIN employees e ON e.id = a.employee_id
        WHERE a.employee_id = ANY($1::varchar[])
        ORDER BY a.attendance_date DESC, a.id DESC
        LIMIT $2
      )
      UNION ALL
      (
        SELECT
          ('leave-' || lr.id) AS id,
          CASE lr.status
            WHEN 'Pending' THEN 'Leave Request Submitted'
            WHEN 'Cancelled' THEN 'Leave Request Cancelled'
            WHEN 'Approved' THEN 'Leave Request Approved'
            WHEN 'TeamLeadApproved' THEN 'Leave Request Approved'
            WHEN 'Rejected' THEN 'Leave Request Rejected'
            ELSE 'Leave Request Updated'
          END AS title,
          CASE lr.status
            WHEN 'Pending' THEN
              e.name || ' submitted a ' || lr.leave_type || ' request (' ||
              TO_CHAR(lr.start_date, 'DD Mon YYYY') ||
              CASE WHEN lr.end_date <> lr.start_date
                THEN ' - ' || TO_CHAR(lr.end_date, 'DD Mon YYYY')
                ELSE ''
              END || ').'
            WHEN 'Cancelled' THEN
              e.name || ' cancelled a ' || lr.leave_type || ' request (' ||
              TO_CHAR(lr.start_date, 'DD Mon YYYY') ||
              CASE WHEN lr.end_date <> lr.start_date
                THEN ' - ' || TO_CHAR(lr.end_date, 'DD Mon YYYY')
                ELSE ''
              END || ').'
            WHEN 'Approved' THEN
              e.name || '''s ' || lr.leave_type || ' request (' ||
              TO_CHAR(lr.start_date, 'DD Mon YYYY') ||
              CASE WHEN lr.end_date <> lr.start_date
                THEN ' - ' || TO_CHAR(lr.end_date, 'DD Mon YYYY')
                ELSE ''
              END || ') has been approved.'
            WHEN 'TeamLeadApproved' THEN
              e.name || '''s ' || lr.leave_type || ' request (' ||
              TO_CHAR(lr.start_date, 'DD Mon YYYY') ||
              CASE WHEN lr.end_date <> lr.start_date
                THEN ' - ' || TO_CHAR(lr.end_date, 'DD Mon YYYY')
                ELSE ''
              END || ') has been approved by Team Lead.'
            ELSE
              e.name || '''s ' || lr.leave_type || ' request (' ||
              TO_CHAR(lr.start_date, 'DD Mon YYYY') ||
              CASE WHEN lr.end_date <> lr.start_date
                THEN ' - ' || TO_CHAR(lr.end_date, 'DD Mon YYYY')
                ELSE ''
              END || ') has been rejected.'
          END AS description,
          'Leave' AS category,
          COALESCE(lr.updated_at, lr.created_at, lr.start_date::timestamptz) AS "activityTime",
          CASE
            WHEN lr.status = 'Pending' THEN 'Pending'
            WHEN lr.status = 'Approved' THEN 'Approved'
            WHEN lr.status = 'Rejected' THEN 'Rejected'
            WHEN lr.status = 'Cancelled' THEN 'Cancelled'
            WHEN lr.status = 'TeamLeadApproved' THEN 'TeamLeadApproved'
            ELSE 'Pending'
          END AS status,
          CASE lr.status
            WHEN 'Pending' THEN 'leave.submitted'
            WHEN 'Cancelled' THEN 'leave.cancelled'
            WHEN 'Approved' THEN 'leave.approved'
            WHEN 'TeamLeadApproved' THEN 'leave.approved'
            ELSE 'leave.rejected'
          END AS "eventType",
          lr.employee_id AS "subjectEmployeeId",
          NULL::varchar AS "actorEmployeeId",
          jsonb_build_object(
            'leaveRequestId', lr.id,
            'subjectName', e.name,
            'leaveType', lr.leave_type,
            'range',
              TO_CHAR(lr.start_date, 'DD Mon YYYY') ||
              CASE WHEN lr.end_date <> lr.start_date
                THEN ' - ' || TO_CHAR(lr.end_date, 'DD Mon YYYY')
                ELSE ''
              END
          ) AS meta
        FROM leave_requests lr
        INNER JOIN employees e ON e.id = lr.employee_id
        WHERE lr.employee_id = ANY($1::varchar[])
        ORDER BY COALESCE(lr.updated_at, lr.created_at, lr.start_date::timestamptz) DESC, lr.id DESC
        LIMIT $2
      )
    ) activities
    ORDER BY "activityTime" DESC, id DESC
    LIMIT $2
    `,
    [ids, limit],
  )

  return result.rows
}

export async function findEmployeeActivityRows(employeeId, limit = 10) {
  return findActivityRowsForEmployees([employeeId], limit)
}

export async function findTeamActivityRows(headEmployeeId, limit = 10) {
  const teamIds = await findTeamEmployeeIds(headEmployeeId)
  return findActivityRowsForEmployees(teamIds, limit)
}

export async function getEmployeeRecentActivities(employeeId) {
  return findEmployeeActivityRows(employeeId, 10)
}

export async function getTeamRecentActivities(headEmployeeId) {
  return findTeamActivityRows(headEmployeeId, 15)
}


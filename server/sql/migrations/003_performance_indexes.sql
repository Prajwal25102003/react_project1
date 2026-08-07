-- Performance indexes for attendance + leave list filters.
-- Safe to re-run (IF NOT EXISTS).

CREATE INDEX IF NOT EXISTS idx_attendance_date
  ON attendance (attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id
  ON attendance (employee_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_employee_date
  ON attendance (employee_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id
  ON leave_requests (employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status_dates
  ON leave_requests (status, start_date, end_date);

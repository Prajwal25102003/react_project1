-- Hot-path indexes for dashboard KPIs, list filters, and activity queries.
-- Safe to re-run (IF NOT EXISTS).

CREATE INDEX IF NOT EXISTS idx_attendance_date
  ON attendance (attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id
  ON attendance (employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id
  ON leave_requests (employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status_dates
  ON leave_requests (status, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_employees_department_id
  ON employees (department_id);

CREATE INDEX IF NOT EXISTS idx_employees_status
  ON employees (status);

CREATE INDEX IF NOT EXISTS idx_employees_joining_date
  ON employees (joining_date);

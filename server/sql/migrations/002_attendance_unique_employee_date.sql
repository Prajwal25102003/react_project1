-- Existing databases: one attendance row per employee per day.
-- Safe to re-run (IF NOT EXISTS). Deduplicate before adding the constraint.

DELETE FROM attendance a
USING attendance b
WHERE a.employee_id = b.employee_id
  AND a.attendance_date = b.attendance_date
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_employee_date
  ON attendance (employee_id, attendance_date);

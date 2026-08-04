-- Indexes on foreign-key columns that lacked a leading index.
-- Speeds joins, lookups, and ON DELETE / SET NULL checks.
-- Safe to re-run (IF NOT EXISTS).

CREATE INDEX IF NOT EXISTS idx_departments_head_employee_id
  ON departments (head_employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_hierarchy_id
  ON leave_requests (hierarchy_id);

-- policy_id index omitted: column is dropped in 035_drop_unused_schema.sql

CREATE INDEX IF NOT EXISTS idx_leave_approval_hierarchy_steps_approver_employee
  ON leave_approval_hierarchy_steps (approver_employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_request_hierarchy_steps_approver_employee
  ON leave_request_hierarchy_steps (approver_employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_approval_history_actor_employee
  ON leave_approval_history (actor_employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_approval_history_actor_user
  ON leave_approval_history (actor_user_id);

CREATE INDEX IF NOT EXISTS idx_holiday_calendars_released_by
  ON holiday_calendars (released_by);

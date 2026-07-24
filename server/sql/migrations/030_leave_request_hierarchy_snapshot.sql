-- Per-request frozen approval chain. Mid-flight leave keeps these steps even when
-- admin edits leave_approval_hierarchy_steps. Safe to re-run.

CREATE TABLE IF NOT EXISTS leave_request_hierarchy_steps (
  id SERIAL PRIMARY KEY,
  leave_request_id VARCHAR(20) NOT NULL
    REFERENCES leave_requests(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_kind VARCHAR(32) NOT NULL
    CHECK (approver_kind IN ('department_head', 'role', 'employee')),
  approver_role VARCHAR(16)
    CHECK (approver_role IS NULL OR approver_role IN ('hr', 'admin')),
  approver_employee_id VARCHAR(20)
    REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT leave_request_hierarchy_steps_order_unique
    UNIQUE (leave_request_id, step_order),
  CONSTRAINT leave_request_hierarchy_steps_kind_check CHECK (
    (
      approver_kind = 'department_head'
      AND approver_role IS NULL
      AND approver_employee_id IS NULL
    )
    OR (
      approver_kind = 'role'
      AND approver_role IS NOT NULL
      AND approver_employee_id IS NULL
    )
    OR (
      approver_kind = 'employee'
      AND approver_employee_id IS NOT NULL
      AND approver_role IS NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_leave_request_hierarchy_steps_request
  ON leave_request_hierarchy_steps (leave_request_id, step_order);

-- Backfill snapshots from the live hierarchy config for existing leave rows.
INSERT INTO leave_request_hierarchy_steps (
  leave_request_id,
  step_order,
  approver_kind,
  approver_role,
  approver_employee_id
)
SELECT
  lr.id,
  s.step_order,
  s.approver_kind,
  s.approver_role,
  s.approver_employee_id
FROM leave_requests lr
INNER JOIN leave_approval_hierarchy_steps s
  ON s.hierarchy_id = lr.hierarchy_id
WHERE lr.hierarchy_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM leave_request_hierarchy_steps rs
    WHERE rs.leave_request_id = lr.id
  );

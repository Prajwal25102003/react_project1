-- Admin-configurable leave approval hierarchies.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS leave_approval_hierarchies (
  id SERIAL PRIMARY KEY,
  category VARCHAR(32) NOT NULL UNIQUE
    CHECK (category IN ('employee', 'department_head', 'hr')),
  name VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_approval_hierarchy_steps (
  id SERIAL PRIMARY KEY,
  hierarchy_id INTEGER NOT NULL
    REFERENCES leave_approval_hierarchies(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_kind VARCHAR(32) NOT NULL
    CHECK (approver_kind IN ('department_head', 'role', 'employee')),
  approver_role VARCHAR(16)
    CHECK (approver_role IS NULL OR approver_role IN ('hr', 'admin')),
  approver_employee_id VARCHAR(20)
    REFERENCES employees(id) ON DELETE SET NULL,
  CONSTRAINT leave_approval_hierarchy_steps_order_unique
    UNIQUE (hierarchy_id, step_order),
  CONSTRAINT leave_approval_hierarchy_steps_kind_check CHECK (
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

CREATE INDEX IF NOT EXISTS idx_leave_approval_hierarchy_steps_hierarchy
  ON leave_approval_hierarchy_steps (hierarchy_id, step_order);

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS hierarchy_id INTEGER
    REFERENCES leave_approval_hierarchies(id);

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS current_step INTEGER;

-- Seed default chains matching previous hardcoded behaviour.
INSERT INTO leave_approval_hierarchies (category, name, is_active)
VALUES
  ('employee', 'Employee leave', TRUE),
  ('department_head', 'Department head leave', TRUE),
  ('hr', 'HR leave', TRUE)
ON CONFLICT (category) DO NOTHING;

INSERT INTO leave_approval_hierarchy_steps (
  hierarchy_id, step_order, approver_kind, approver_role, approver_employee_id
)
SELECT h.id, 1, 'department_head', NULL, NULL
FROM leave_approval_hierarchies h
WHERE h.category = 'employee'
  AND NOT EXISTS (
    SELECT 1 FROM leave_approval_hierarchy_steps s WHERE s.hierarchy_id = h.id
  );

INSERT INTO leave_approval_hierarchy_steps (
  hierarchy_id, step_order, approver_kind, approver_role, approver_employee_id
)
SELECT h.id, 2, 'role', 'hr', NULL
FROM leave_approval_hierarchies h
WHERE h.category = 'employee'
  AND NOT EXISTS (
    SELECT 1
    FROM leave_approval_hierarchy_steps s
    WHERE s.hierarchy_id = h.id AND s.step_order = 2
  );

INSERT INTO leave_approval_hierarchy_steps (
  hierarchy_id, step_order, approver_kind, approver_role, approver_employee_id
)
SELECT h.id, 1, 'role', 'hr', NULL
FROM leave_approval_hierarchies h
WHERE h.category = 'department_head'
  AND NOT EXISTS (
    SELECT 1 FROM leave_approval_hierarchy_steps s WHERE s.hierarchy_id = h.id
  );

INSERT INTO leave_approval_hierarchy_steps (
  hierarchy_id, step_order, approver_kind, approver_role, approver_employee_id
)
SELECT h.id, 1, 'role', 'admin', NULL
FROM leave_approval_hierarchies h
WHERE h.category = 'hr'
  AND NOT EXISTS (
    SELECT 1 FROM leave_approval_hierarchy_steps s WHERE s.hierarchy_id = h.id
  );

-- Mid-chain legacy rows: TeamLeadApproved → Pending at step 2 of employee chain.
UPDATE leave_requests lr
SET
  status = 'Pending',
  hierarchy_id = COALESCE(
    lr.hierarchy_id,
    (SELECT id FROM leave_approval_hierarchies WHERE category = 'employee' LIMIT 1)
  ),
  current_step = COALESCE(lr.current_step, 2),
  updated_at = NOW()
WHERE lr.status = 'TeamLeadApproved';

-- Backfill open Pending rows without a hierarchy snapshot.
UPDATE leave_requests lr
SET
  hierarchy_id = CASE
    WHEN EXISTS (
      SELECT 1 FROM users u
      WHERE u.employee_id = lr.employee_id AND u.role = 'hr'
    ) THEN (SELECT id FROM leave_approval_hierarchies WHERE category = 'hr' LIMIT 1)
    WHEN EXISTS (
      SELECT 1
      FROM employees e
      INNER JOIN departments d ON d.id = e.department_id
      WHERE e.id = lr.employee_id
        AND d.head_employee_id = e.id
    ) THEN (
      SELECT id FROM leave_approval_hierarchies WHERE category = 'department_head' LIMIT 1
    )
    ELSE (SELECT id FROM leave_approval_hierarchies WHERE category = 'employee' LIMIT 1)
  END,
  current_step = COALESCE(lr.current_step, 1),
  updated_at = NOW()
WHERE lr.status = 'Pending'
  AND lr.hierarchy_id IS NULL;

-- Closed rows: attach hierarchy for display when missing; clear current_step.
UPDATE leave_requests lr
SET
  hierarchy_id = COALESCE(
    lr.hierarchy_id,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM users u
        WHERE u.employee_id = lr.employee_id AND u.role = 'hr'
      ) THEN (SELECT id FROM leave_approval_hierarchies WHERE category = 'hr' LIMIT 1)
      WHEN EXISTS (
        SELECT 1
        FROM employees e
        INNER JOIN departments d ON d.id = e.department_id
        WHERE e.id = lr.employee_id
          AND d.head_employee_id = e.id
      ) THEN (
        SELECT id FROM leave_approval_hierarchies WHERE category = 'department_head' LIMIT 1
      )
      ELSE (SELECT id FROM leave_approval_hierarchies WHERE category = 'employee' LIMIT 1)
    END
  ),
  current_step = NULL,
  updated_at = NOW()
WHERE lr.status IN ('Approved', 'Rejected', 'Cancelled')
  AND lr.hierarchy_id IS NULL;

ALTER TABLE leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_status_check;

ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_status_check
  CHECK (status IN (
    'Pending',
    'Approved',
    'Rejected',
    'Cancelled'
  ));

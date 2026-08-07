-- Drop unused legacy leave-approval policy tables/columns and
-- unused department denormalized fields.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) leave_requests.policy_id (superseded by hierarchy_id)
-- ---------------------------------------------------------------------------
ALTER TABLE leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_policy_id_fkey;

DROP INDEX IF EXISTS idx_leave_requests_policy_id;

ALTER TABLE leave_requests
  DROP COLUMN IF EXISTS policy_id;

-- ---------------------------------------------------------------------------
-- 2) leave_approval_policy_steps + leave_approval_policies (unused legacy)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS leave_approval_policy_steps;
DROP TABLE IF EXISTS leave_approval_policies;

-- ---------------------------------------------------------------------------
-- 3) departments.employee_count / description (unused by app reads)
-- ---------------------------------------------------------------------------
ALTER TABLE departments
  DROP COLUMN IF EXISTS employee_count;

ALTER TABLE departments
  DROP COLUMN IF EXISTS description;

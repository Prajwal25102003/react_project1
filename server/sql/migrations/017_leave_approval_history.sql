-- Leave multi-level approval history with remarks.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS leave_approval_history (
  id SERIAL PRIMARY KEY,
  leave_request_id VARCHAR(20) NOT NULL
    REFERENCES leave_requests(id) ON DELETE CASCADE,
  step VARCHAR(40) NOT NULL
    CHECK (step IN ('Submit', 'TeamLead', 'HR', 'Admin', 'HigherAuthority', 'Cancel')),
  action VARCHAR(20) NOT NULL
    CHECK (action IN ('Submitted', 'Approved', 'Rejected', 'Cancelled')),
  actor_user_id INTEGER,
  actor_employee_id VARCHAR(20),
  actor_name VARCHAR(120) NOT NULL,
  actor_role VARCHAR(40) NOT NULL,
  remarks TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_approval_history_request
  ON leave_approval_history (leave_request_id, created_at ASC);

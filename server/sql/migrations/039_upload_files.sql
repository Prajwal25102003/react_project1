-- Track uploaded files for ownership / authz.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS upload_files (
  filename VARCHAR(255) PRIMARY KEY,
  kind VARCHAR(20) NOT NULL,
  uploaded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  employee_id VARCHAR(20) REFERENCES employees(id) ON DELETE SET NULL,
  leave_request_id VARCHAR(20) REFERENCES leave_requests(id) ON DELETE SET NULL,
  original_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT upload_files_kind_check
    CHECK (kind IN ('avatar', 'medical'))
);

CREATE INDEX IF NOT EXISTS idx_upload_files_uploaded_by
  ON upload_files (uploaded_by_user_id);

CREATE INDEX IF NOT EXISTS idx_upload_files_leave_request
  ON upload_files (leave_request_id)
  WHERE leave_request_id IS NOT NULL;

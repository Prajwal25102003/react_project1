-- Ensure attendance import audit table exists, and drop unused leave_requests
-- legacy columns superseded by hierarchy snapshots (current_step + steps table).
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) attendance_import_files (used by attendanceImportFilesModel.js)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_import_files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  uploaded_by VARCHAR(50),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_import_files_uploaded_at
  ON attendance_import_files (uploaded_at DESC);

-- ---------------------------------------------------------------------------
-- 2) leave_requests legacy workflow columns (unused by app models)
-- ---------------------------------------------------------------------------
ALTER TABLE leave_requests
  DROP COLUMN IF EXISTS current_step_order;

ALTER TABLE leave_requests
  DROP COLUMN IF EXISTS awaiting_label;

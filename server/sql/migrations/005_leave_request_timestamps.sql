-- Track when leave requests are created / last updated for activity feeds.
-- Safe to re-run.

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Prefer leave dates for rows that only have the column default.
UPDATE leave_requests
SET
  created_at = start_date::timestamptz,
  updated_at = start_date::timestamptz
WHERE created_at::date = CURRENT_DATE
  AND updated_at::date = CURRENT_DATE
  AND start_date < CURRENT_DATE;

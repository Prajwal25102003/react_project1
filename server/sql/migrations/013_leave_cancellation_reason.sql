-- Reason provided when a leave request is cancelled.

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NOT NULL DEFAULT '';

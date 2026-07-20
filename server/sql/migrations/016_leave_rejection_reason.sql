-- Reason when a leave request is rejected (team lead / HR).

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT NOT NULL DEFAULT '';

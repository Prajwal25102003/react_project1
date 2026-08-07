-- Allow employees to cancel pending leave requests.
-- Safe to re-run.

ALTER TABLE leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_status_check;

ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_status_check
  CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled'));

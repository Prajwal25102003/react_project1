-- Allow Admin (and future HigherAuthority) steps on leave approval history.
-- Safe to re-run.

ALTER TABLE leave_approval_history
  DROP CONSTRAINT IF EXISTS leave_approval_history_step_check;

ALTER TABLE leave_approval_history
  ADD CONSTRAINT leave_approval_history_step_check
  CHECK (
    step IN (
      'Submit',
      'TeamLead',
      'HR',
      'Admin',
      'HigherAuthority',
      'Cancel'
    )
  );

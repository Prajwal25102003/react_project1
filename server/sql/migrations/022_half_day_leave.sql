-- Half-day leave: fractional leave_days + morning/afternoon session.
-- Also allow fractional casual/sick/LOP balances.
-- Safe to re-run.

ALTER TABLE leave_requests
  ALTER COLUMN leave_days TYPE NUMERIC(4, 1)
  USING leave_days::numeric;

ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS half_day_session VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leave_requests_half_day_session_check'
  ) THEN
    ALTER TABLE leave_requests
      ADD CONSTRAINT leave_requests_half_day_session_check
      CHECK (
        half_day_session IS NULL
        OR half_day_session IN ('first_half', 'second_half')
      );
  END IF;
END $$;

ALTER TABLE employees
  ALTER COLUMN casual_leave_balance TYPE NUMERIC(4, 1)
  USING casual_leave_balance::numeric;

ALTER TABLE employees
  ALTER COLUMN sick_leave_balance TYPE NUMERIC(4, 1)
  USING sick_leave_balance::numeric;

ALTER TABLE employees
  ALTER COLUMN lop_days TYPE NUMERIC(6, 1)
  USING lop_days::numeric;

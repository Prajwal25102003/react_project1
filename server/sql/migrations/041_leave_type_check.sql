-- Constrain leave_type to known EMS values (includes legacy Loss of Pay rows).
-- Safe to re-run.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leave_requests_leave_type_check'
      AND conrelid = 'leave_requests'::regclass
  ) THEN
    ALTER TABLE leave_requests
      ADD CONSTRAINT leave_requests_leave_type_check
      CHECK (
        leave_type = ANY (
          ARRAY[
            'Sick Leave',
            'Casual Leave',
            'Maternity Leave',
            'Medical Leave',
            'Work from Home',
            'Loss of Pay'
          ]::text[]
        )
      );
  END IF;
END $$;

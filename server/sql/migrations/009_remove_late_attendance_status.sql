-- Remove Late attendance status; convert existing Late rows to Present.

UPDATE attendance
SET status = 'Present'
WHERE status = 'Late';

UPDATE recent_activities
SET status = 'Present',
    title = CASE
      WHEN title ILIKE '%late%' THEN 'Attendance marked'
      ELSE title
    END,
    description = CASE
      WHEN description ILIKE '%late%' THEN REPLACE(description, 'late', 'Present')
      ELSE description
    END
WHERE status = 'Late'
   OR (category = 'Attendance' AND (title ILIKE '%late%' OR description ILIKE '%late%'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'attendance'
      AND constraint_name = 'attendance_status_check'
  ) THEN
    ALTER TABLE attendance DROP CONSTRAINT attendance_status_check;
  END IF;
END $$;

ALTER TABLE attendance
  ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('Present', 'Absent', 'Half Day'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'recent_activities'
      AND constraint_name = 'recent_activities_status_check'
  ) THEN
    ALTER TABLE recent_activities
      DROP CONSTRAINT recent_activities_status_check;
  END IF;
END $$;

ALTER TABLE recent_activities
  ADD CONSTRAINT recent_activities_status_check CHECK (
    status IN (
      'Completed',
      'Pending',
      'Info',
      'Added',
      'Updated',
      'Removed',
      'Approved',
      'Rejected',
      'Cancelled',
      'Present',
      'Absent',
      'Half Day'
    )
  );

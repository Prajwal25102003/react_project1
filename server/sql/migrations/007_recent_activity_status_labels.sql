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
      'Late',
      'Half Day'
    )
  );

UPDATE recent_activities
SET status = CASE
  WHEN category = 'Employees' AND title ILIKE '%added%' THEN 'Added'
  WHEN category = 'Employees' AND title ILIKE '%updated%' THEN 'Updated'
  WHEN category = 'Employees' AND title ILIKE '%removed%' THEN 'Removed'
  WHEN category = 'Departments' AND title ILIKE '%created%' THEN 'Added'
  WHEN category = 'Departments' AND title ILIKE '%updated%' THEN 'Updated'
  WHEN category = 'Departments' AND title ILIKE '%removed%' THEN 'Removed'
  WHEN category = 'Attendance' AND description ILIKE '%(Present)%' THEN 'Present'
  WHEN category = 'Attendance' AND description ILIKE '%(Absent)%' THEN 'Absent'
  WHEN category = 'Attendance' AND description ILIKE '%(Late)%' THEN 'Late'
  WHEN category = 'Attendance' AND description ILIKE '%(Half Day)%' THEN 'Half Day'
  WHEN category = 'Attendance' AND title ILIKE '%late%' THEN 'Late'
  WHEN category = 'Attendance' AND title ILIKE '%removed%' THEN 'Removed'
  WHEN category = 'Leave' AND title ILIKE '%submitted%' THEN 'Pending'
  WHEN category = 'Leave' AND title ILIKE '%approved%' THEN 'Approved'
  WHEN category = 'Leave' AND title ILIKE '%rejected%' THEN 'Rejected'
  WHEN category = 'Leave' AND title ILIKE '%cancelled%' THEN 'Cancelled'
  ELSE status
END
WHERE status = 'Info'
   OR category IN ('Attendance', 'Leave', 'Employees', 'Departments');

CREATE TABLE IF NOT EXISTS recent_activities (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(60) NOT NULL,
  activity_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL CHECK (
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
  ),
  event_type VARCHAR(60),
  subject_employee_id VARCHAR(20),
  actor_employee_id VARCHAR(20),
  meta JSONB
);

INSERT INTO recent_activities (id, title, description, category, activity_time, status) VALUES
  (
    'ACT-01',
    'New Employee Added',
    'Aditya Kunal joined the Development Department as QA Engineer.',
    'Employees',
    NOW() - INTERVAL '2 hours',
    'Completed'
  ),
  (
    'ACT-02',
    'Leave Request Approved',
    'Suresh Milan''s Sick Leave request (14 Jul 2026 - 15 Jul 2026) has been approved by HR Manager.',
    'Leave',
    NOW() - INTERVAL '4 hours',
    'Completed'
  ),
  (
    'ACT-03',
    'Leave Request Submitted',
    'Ananya Reva submitted a Casual Leave request (18 Jul 2026).',
    'Leave',
    NOW() - INTERVAL '5 hours',
    'Pending'
  ),
  (
    'ACT-05',
    'Human Resources Department Updated',
    'HR Admin assigned Siddharth Menon as head of Human Resources.',
    'Departments',
    NOW() - INTERVAL '2 days',
    'Updated'
  ),
  (
    'ACT-06',
    'Attendance Marked',
    'Siddharth Menon checked in at 09:05 AM.',
    'Attendance',
    NOW() - INTERVAL '2 days',
    'Present'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  activity_time = EXCLUDED.activity_time,
  status = EXCLUDED.status;

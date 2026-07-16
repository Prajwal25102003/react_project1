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
      'Late',
      'Half Day'
    )
  )
);

INSERT INTO recent_activities (id, title, description, category, activity_time, status) VALUES
  (
    'ACT-01',
    'New employee added',
    'Aditya Kunal joined Engineering as QA Engineer in Bengaluru.',
    'Employees',
    NOW() - INTERVAL '2 hours',
    'Completed'
  ),
  (
    'ACT-02',
    'Leave approved',
    'Suresh Milan — Sick Leave (14–15 Jul) approved by HR.',
    'Leave',
    NOW() - INTERVAL '4 hours',
    'Completed'
  ),
  (
    'ACT-03',
    'Leave request submitted',
    'Ananya Reva requested Casual Leave for 18 Jul.',
    'Leave',
    NOW() - INTERVAL '5 hours',
    'Pending'
  ),
  (
    'ACT-05',
    'Department head updated',
    'Siddharth Menon assigned as head of Human Resources.',
    'Departments',
    NOW() - INTERVAL '2 days',
    'Updated'
  ),
  (
    'ACT-06',
    'Attendance marked late',
    'Siddharth Menon checked in late on 14 Jul.',
    'Attendance',
    NOW() - INTERVAL '2 days',
    'Late'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  activity_time = EXCLUDED.activity_time,
  status = EXCLUDED.status;

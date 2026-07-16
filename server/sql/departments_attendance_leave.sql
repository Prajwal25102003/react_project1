-- Depends on departments + employees from employees.sql

CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(20) PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL REFERENCES employees(id),
  attendance_date DATE NOT NULL,
  check_in VARCHAR(20),
  check_out VARCHAR(20),
  working_hours NUMERIC(5, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Half Day')),
  UNIQUE (employee_id, attendance_date)
);

INSERT INTO attendance (
  id, employee_id, attendance_date,
  check_in, check_out, working_hours, status
) VALUES
  ('ATT-5001', 'EMP-1001', '2026-07-14', '09:02 AM', '06:05 PM', 9.05, 'Present'),
  ('ATT-5002', 'EMP-1002', '2026-07-14', '09:28 AM', '06:10 PM', 8.70, 'Present'),
  ('ATT-5003', 'EMP-1003', '2026-07-14', '09:00 AM', '01:00 PM', 4.00, 'Half Day'),
  ('ATT-5004', 'EMP-1005', '2026-07-14', '08:55 AM', '05:58 PM', 9.05, 'Present'),
  ('ATT-5005', 'EMP-1006', '2026-07-14', '—', '—', 0.00, 'Absent'),
  ('ATT-5006', 'EMP-1007', '2026-07-14', '09:05 AM', '06:15 PM', 9.17, 'Present'),
  ('ATT-5007', 'EMP-1008', '2026-07-13', '09:40 AM', '06:20 PM', 8.67, 'Present'),
  ('ATT-5008', 'EMP-1001', '2026-07-13', '08:58 AM', '06:02 PM', 9.07, 'Present')
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  attendance_date = EXCLUDED.attendance_date,
  check_in = EXCLUDED.check_in,
  check_out = EXCLUDED.check_out,
  working_hours = EXCLUDED.working_hours,
  status = EXCLUDED.status;

CREATE TABLE IF NOT EXISTS leave_requests (
  id VARCHAR(20) PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL REFERENCES employees(id),
  leave_type VARCHAR(60) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO leave_requests (
  id, employee_id, leave_type, start_date, end_date, leave_days, reason, status
) VALUES
  (
    'LR-3001', 'EMP-1006', 'Sick Leave', '2026-07-14', '2026-07-15', 2,
    'Recovering from viral fever as advised by the family doctor in Kochi.', 'Approved'
  ),
  (
    'LR-3002', 'EMP-1005', 'Casual Leave', '2026-07-18', '2026-07-18', 1,
    'Need to visit the RTO office in Bengaluru for vehicle documents.', 'Pending'
  ),
  (
    'LR-3003', 'EMP-1008', 'Casual Leave', '2026-08-01', '2026-08-05', 5,
    'Family trip to Manali during the monsoon break.', 'Pending'
  ),
  (
    'LR-3004', 'EMP-1003', 'Casual Leave', '2026-07-10', '2026-07-10', 1,
    'Attending a cousin''s wedding reception in Ahmedabad.', 'Approved'
  ),
  (
    'LR-3005', 'EMP-1004', 'Casual Leave', '2026-07-20', '2026-07-22', 3,
    'Requested leave overlaps with the Hyderabad sales sprint — rejected by manager.', 'Rejected'
  ),
  (
    'LR-3006', 'EMP-1007', 'Sick Leave', '2026-07-08', '2026-07-09', 2,
    'Medical checkup and recovery at Apollo Hospital, Pune.', 'Approved'
  ),
  (
    'LR-3007', 'EMP-1001', 'Maternity Leave', '2026-09-12', '2026-09-16', 5,
    'Maternity leave as planned with team coverage.', 'Pending'
  )
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  leave_type = EXCLUDED.leave_type,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  leave_days = EXCLUDED.leave_days,
  reason = EXCLUDED.reason,
  status = EXCLUDED.status;

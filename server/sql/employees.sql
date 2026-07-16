-- Fresh install: create departments first (head filled after employees exist).
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  head_employee_id VARCHAR(20),
  employee_count INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL
);

INSERT INTO departments (id, name, head_employee_id, employee_count, description) VALUES
  (
    'DEP-01', 'Engineering', NULL, 42,
    'Builds and maintains product features, cloud infrastructure, and engineering quality for India operations.'
  ),
  (
    'DEP-02', 'Human Resources', NULL, 12,
    'Manages hiring, employee relations, PF/ESI compliance, leave policies, and people operations.'
  ),
  (
    'DEP-03', 'Marketing', NULL, 18,
    'Handles brand communication, digital campaigns, regional content, and market research across India.'
  ),
  (
    'DEP-04', 'Sales', NULL, 25,
    'Drives revenue through enterprise sales, channel partners, and account management in metro cities.'
  ),
  (
    'DEP-05', 'Finance', NULL, 15,
    'Oversees budgeting, payroll, GST compliance, financial reporting, and statutory filings.'
  ),
  (
    'DEP-06', 'Operations', NULL, 20,
    'Coordinates day-to-day business operations, vendor management, and cross-team delivery.'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  employee_count = EXCLUDED.employee_count,
  description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(40) NOT NULL,
  gender VARCHAR(20) NOT NULL,
  department_id VARCHAR(20) NOT NULL REFERENCES departments(id),
  designation VARCHAR(120) NOT NULL,
  joining_date DATE NOT NULL,
  salary NUMERIC(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Inactive')),
  avatar VARCHAR(255)
);

INSERT INTO employees (
  id, name, email, phone, gender, department_id, designation,
  joining_date, salary, status, avatar
) VALUES
  (
    'EMP-1001', 'Arjun Tejas', 'arjuntejas@company.in',
    '+91 98765 41001', 'Male', 'DEP-01', 'Senior Frontend Developer',
    '2022-03-14', 95000.00, 'Active', NULL
  ),
  (
    'EMP-1002', 'Siddharth Menon', 'siddharthmenon@company.in',
    '+91 98765 41002', 'Male', 'DEP-02', 'HR Manager',
    '2021-08-02', 88000.00, 'Active', NULL
  ),
  (
    'EMP-1003', 'Rohan Sameer', 'rohansameer@company.in',
    '+91 98765 41003', 'Male', 'DEP-03', 'Content Strategist',
    '2023-01-20', 62000.00, 'Active', NULL
  ),
  (
    'EMP-1004', 'Vikram Nikhil', 'vikramnikhil@company.in',
    '+91 98765 41004', 'Male', 'DEP-04', 'Sales Executive',
    '2020-11-09', 55000.00, 'Inactive', NULL
  ),
  (
    'EMP-1005', 'Ananya Reva', 'ananyareva@company.in',
    '+91 98765 41005', 'Female', 'DEP-01', 'Backend Developer',
    '2024-06-01', 78000.00, 'Active', NULL
  ),
  (
    'EMP-1006', 'Suresh Milan', 'sureshmilan@company.in',
    '+91 98765 41006', 'Male', 'DEP-05', 'Payroll Specialist',
    '2022-09-15', 70000.00, 'Active', NULL
  ),
  (
    'EMP-1007', 'Kavya Tara', 'kavyatara@company.in',
    '+91 98765 41007', 'Female', 'DEP-06', 'Operations Lead',
    '2019-04-22', 92000.00, 'Active', NULL
  ),
  (
    'EMP-1008', 'Aditya Kunal', 'adityakunal@company.in',
    '+91 98765 41008', 'Male', 'DEP-01', 'QA Engineer',
    '2025-02-10', 58000.00, 'Active', NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  gender = EXCLUDED.gender,
  department_id = EXCLUDED.department_id,
  designation = EXCLUDED.designation,
  joining_date = EXCLUDED.joining_date,
  salary = EXCLUDED.salary,
  status = EXCLUDED.status,
  avatar = EXCLUDED.avatar;

UPDATE departments SET head_employee_id = 'EMP-1001' WHERE id = 'DEP-01';
UPDATE departments SET head_employee_id = 'EMP-1002' WHERE id = 'DEP-02';
UPDATE departments SET head_employee_id = 'EMP-1003' WHERE id = 'DEP-03';
UPDATE departments SET head_employee_id = 'EMP-1004' WHERE id = 'DEP-04';
UPDATE departments SET head_employee_id = 'EMP-1006' WHERE id = 'DEP-05';
UPDATE departments SET head_employee_id = 'EMP-1007' WHERE id = 'DEP-06';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_departments_head_employee'
  ) THEN
    ALTER TABLE departments
      ADD CONSTRAINT fk_departments_head_employee
      FOREIGN KEY (head_employee_id) REFERENCES employees(id);
  END IF;
END $$;

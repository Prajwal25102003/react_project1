-- Fresh install: create departments first (heads + employees filled by seedEmployees.js).
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  head_employee_id VARCHAR(20),
  employee_count INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL
);

INSERT INTO departments (id, name, head_employee_id, employee_count, description) VALUES
  (
    'DEP-01', 'Development', NULL, 20,
    'Builds and maintains product features, cloud infrastructure, and development quality for India operations.'
  ),
  (
    'DEP-02', 'Human Resources', NULL, 5,
    'Manages hiring, employee relations, PF/ESI compliance, leave policies, and people operations.'
  ),
  (
    'DEP-03', 'Marketing', NULL, 20,
    'Handles brand communication, digital campaigns, regional content, and market research across India.'
  ),
  (
    'DEP-04', 'Sales', NULL, 20,
    'Drives revenue through enterprise sales, channel partners, and account management in metro cities.'
  ),
  (
    'DEP-05', 'Finance', NULL, 20,
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
  avatar VARCHAR(255),
  casual_leave_balance INTEGER NOT NULL DEFAULT 1 CHECK (casual_leave_balance >= 0),
  sick_leave_balance INTEGER NOT NULL DEFAULT 1 CHECK (sick_leave_balance >= 0),
  lop_days INTEGER NOT NULL DEFAULT 0 CHECK (lop_days >= 0)
);

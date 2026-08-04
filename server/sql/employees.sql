-- Fresh install: create departments first (heads + employees filled by seedEmployees.js).
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  head_employee_id VARCHAR(20)
);

INSERT INTO departments (id, name, head_employee_id) VALUES
  ('DEP-01', 'Development', NULL),
  ('DEP-02', 'Human Resources', NULL),
  ('DEP-03', 'Marketing', NULL),
  ('DEP-04', 'Sales', NULL),
  ('DEP-05', 'Finance', NULL),
  ('DEP-06', 'Operations', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(40) NOT NULL,
  gender VARCHAR(20) NOT NULL,
  department_id VARCHAR(20) REFERENCES departments(id),
  designation VARCHAR(120) NOT NULL,
  joining_date DATE NOT NULL,
  salary NUMERIC(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Inactive')),
  avatar VARCHAR(255),
  casual_leave_balance INTEGER NOT NULL DEFAULT 0 CHECK (casual_leave_balance >= 0),
  sick_leave_balance INTEGER NOT NULL DEFAULT 0 CHECK (sick_leave_balance >= 0),
  lop_days INTEGER NOT NULL DEFAULT 0 CHECK (lop_days >= 0)
);

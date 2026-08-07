-- Auth users for EMS RBAC (run after employees.sql).
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('hr', 'employee', 'admin')),
  employee_id VARCHAR(20) REFERENCES employees(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users (employee_id);

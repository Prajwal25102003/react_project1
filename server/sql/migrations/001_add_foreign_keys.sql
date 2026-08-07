-- Link EMS tables with foreign keys.
-- Order: departments <- employees <- attendance / leave_requests / department head

-- 1) Employees -> Departments
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS department_id VARCHAR(20);

UPDATE employees e
SET department_id = d.id
FROM departments d
WHERE e.department_id IS NULL
  AND d.name = e.department;

ALTER TABLE employees
  ALTER COLUMN department_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_employees_department'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT fk_employees_department
      FOREIGN KEY (department_id) REFERENCES departments(id);
  END IF;
END $$;

ALTER TABLE employees DROP COLUMN IF EXISTS department;

-- 2) Departments head -> Employees
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS head_employee_id VARCHAR(20);

UPDATE departments d
SET head_employee_id = e.id
FROM employees e
WHERE d.head_employee_id IS NULL
  AND e.name = d.head;

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

ALTER TABLE departments DROP COLUMN IF EXISTS head;

-- 3) Attendance -> Employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_attendance_employee'
  ) THEN
    ALTER TABLE attendance
      ADD CONSTRAINT fk_attendance_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id);
  END IF;
END $$;

ALTER TABLE attendance DROP COLUMN IF EXISTS employee_name;

-- 4) Leave requests -> Employees
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20);

UPDATE leave_requests lr
SET employee_id = e.id
FROM employees e
WHERE lr.employee_id IS NULL
  AND e.name = lr.employee_name;

ALTER TABLE leave_requests
  ALTER COLUMN employee_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_leave_requests_employee'
  ) THEN
    ALTER TABLE leave_requests
      ADD CONSTRAINT fk_leave_requests_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id);
  END IF;
END $$;

ALTER TABLE leave_requests DROP COLUMN IF EXISTS employee_name;

-- Admin is not assigned to any department and does not use leave balances.
-- Links the demo admin login to EMP-1 (System Administrator).
-- Safe to re-run.

ALTER TABLE employees
  ALTER COLUMN department_id DROP NOT NULL;

-- Prefer a single admin-linked employee profile (EMP-1).
UPDATE users
SET employee_id = 'EMP-1',
    name = COALESCE(
      (SELECT name FROM employees WHERE id = 'EMP-1'),
      name
    )
WHERE role = 'admin'
  AND email = 'admin@company.com'
  AND EXISTS (SELECT 1 FROM employees WHERE id = 'EMP-1');

-- Remove the duplicate employee-role login for the admin profile.
DELETE FROM users
WHERE employee_id = 'EMP-1'
  AND role = 'employee';

UPDATE employees e
SET
  department_id = NULL,
  casual_leave_balance = 0,
  sick_leave_balance = 0,
  lop_days = 0
WHERE e.id = 'EMP-1'
   OR EXISTS (
     SELECT 1
     FROM users u
     WHERE u.employee_id = e.id
       AND u.role = 'admin'
   );

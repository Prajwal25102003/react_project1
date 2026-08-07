-- Rename demo admin employee EMP-1999 → EMP-1 so new hires stay sequential.
-- Safe to re-run.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM employees WHERE id = 'EMP-1999')
     AND NOT EXISTS (SELECT 1 FROM employees WHERE id = 'EMP-1') THEN
    -- Free the unique email so EMP-1 can reuse it.
    UPDATE employees
      SET email = 'rahulaman-migrating@company.in'
      WHERE id = 'EMP-1999';

    INSERT INTO employees (
      id, name, email, phone, gender, department_id, designation,
      joining_date, salary, status, avatar,
      casual_leave_balance, sick_leave_balance, lop_days
    )
    SELECT
      'EMP-1',
      name,
      'rahulaman@company.in',
      phone,
      gender,
      department_id,
      designation,
      joining_date,
      salary,
      status,
      avatar,
      casual_leave_balance,
      sick_leave_balance,
      lop_days
    FROM employees
    WHERE id = 'EMP-1999';

    UPDATE attendance SET employee_id = 'EMP-1' WHERE employee_id = 'EMP-1999';
    UPDATE leave_requests SET employee_id = 'EMP-1' WHERE employee_id = 'EMP-1999';
    UPDATE users SET employee_id = 'EMP-1' WHERE employee_id = 'EMP-1999';
    UPDATE departments SET head_employee_id = 'EMP-1' WHERE head_employee_id = 'EMP-1999';
    UPDATE leave_approval_history
      SET actor_employee_id = 'EMP-1'
      WHERE actor_employee_id = 'EMP-1999';

    DELETE FROM employees WHERE id = 'EMP-1999';
  END IF;
END $$;

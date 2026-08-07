-- Resolve duplicate logins per employee, then enforce one user row per employee_id.
-- Safe to re-run.

-- Keep the newest user when multiple logins share an employee_id.
DELETE FROM users u
WHERE u.employee_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM users newer
    WHERE newer.employee_id = u.employee_id
      AND newer.id > u.id
  );

CREATE UNIQUE INDEX IF NOT EXISTS users_employee_id_key
  ON users (employee_id)
  WHERE employee_id IS NOT NULL;

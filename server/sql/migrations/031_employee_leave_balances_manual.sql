-- Paid leave defaults: no automatic annual grant. Balances are set on
-- employee create/edit (optional). Safe to re-run.
-- Does not change existing employee balances — only column defaults for new rows.

ALTER TABLE employees
  ALTER COLUMN casual_leave_balance SET DEFAULT 0;

ALTER TABLE employees
  ALTER COLUMN sick_leave_balance SET DEFAULT 0;

ALTER TABLE employees
  ALTER COLUMN lop_days SET DEFAULT 0;

COMMENT ON COLUMN employees.casual_leave_balance IS
  'Paid casual leave days remaining. Set manually on employee create/edit; not auto-granted yearly.';

COMMENT ON COLUMN employees.sick_leave_balance IS
  'Paid sick leave days remaining. Set manually on employee create/edit; not auto-granted yearly.';

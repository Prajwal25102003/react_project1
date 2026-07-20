-- Paid leave quotas: 1 casual + 1 sick per employee. Excess approved days become LOP.
-- Safe to re-run.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS casual_leave_balance INTEGER NOT NULL DEFAULT 1;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS sick_leave_balance INTEGER NOT NULL DEFAULT 1;

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS lop_days INTEGER NOT NULL DEFAULT 0;

UPDATE employees
SET casual_leave_balance = 1
WHERE casual_leave_balance IS NULL;

UPDATE employees
SET sick_leave_balance = 1
WHERE sick_leave_balance IS NULL;

UPDATE employees
SET lop_days = 0
WHERE lop_days IS NULL;

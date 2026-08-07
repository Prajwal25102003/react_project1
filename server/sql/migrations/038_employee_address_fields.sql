-- Optional address fields for employee profile (no hardcoded placeholders).
-- Safe to re-run.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS country VARCHAR(80);

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS city_state VARCHAR(120);

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

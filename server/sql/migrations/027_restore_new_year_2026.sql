-- Restore New Year Day for the 2026 released calendar (accidentally removed).
-- Safe to re-run (ON CONFLICT).

INSERT INTO holidays (id, name, holiday_date, holiday_type, description)
VALUES (
  'HOL-1000',
  'New Year Day',
  '2026-01-01',
  'National Holiday',
  'Public Holiday'
)
ON CONFLICT (holiday_date, name) DO NOTHING;

-- Company holiday calendar (EMS).
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT).

CREATE TABLE IF NOT EXISTS holidays (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  holiday_date DATE NOT NULL,
  holiday_type VARCHAR(40) NOT NULL
    CHECK (holiday_type IN (
      'National Holiday',
      'Optional Holiday',
      'Festival Holiday'
    )),
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date_name
  ON holidays (holiday_date, name);

CREATE INDEX IF NOT EXISTS idx_holidays_date
  ON holidays (holiday_date);

CREATE INDEX IF NOT EXISTS idx_holidays_type
  ON holidays (holiday_type);

INSERT INTO holidays (id, name, holiday_date, holiday_type, description)
VALUES
  ('HOL-1000', 'New Year Day', '2026-01-01', 'National Holiday', 'Public Holiday'),
  ('HOL-1001', 'Republic Day', '2026-01-26', 'National Holiday', 'Public Holiday'),
  ('HOL-1002', 'Holi', '2026-03-03', 'Festival Holiday', 'Festival of Colors'),
  ('HOL-1003', 'Good Friday', '2026-04-03', 'Optional Holiday', 'Optional Holiday'),
  ('HOL-1004', 'Independence Day', '2026-08-15', 'National Holiday', 'Public Holiday'),
  ('HOL-1005', 'Ganesh Chaturthi', '2026-09-14', 'Festival Holiday', 'Festival Holiday'),
  ('HOL-1006', 'Gandhi Jayanti', '2026-10-02', 'National Holiday', 'Public Holiday'),
  ('HOL-1007', 'Diwali', '2026-11-08', 'Festival Holiday', 'Festival of Lights'),
  ('HOL-1008', 'Christmas', '2026-12-25', 'National Holiday', 'Public Holiday')
ON CONFLICT (id) DO NOTHING;

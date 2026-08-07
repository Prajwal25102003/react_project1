-- Link holidays to holiday_calendars so deleting a calendar year
-- cascades and removes that year's holiday rows.
-- Safe to re-run (IF NOT EXISTS / guarded DO blocks).

ALTER TABLE holidays
  ADD COLUMN IF NOT EXISTS calendar_year INTEGER;

UPDATE holidays
SET calendar_year = EXTRACT(YEAR FROM holiday_date)::INTEGER
WHERE calendar_year IS NULL;

-- Orphans left after manual calendar deletes (no matching year row).
DELETE FROM holidays h
WHERE NOT EXISTS (
  SELECT 1
  FROM holiday_calendars hc
  WHERE hc.year = h.calendar_year
);

ALTER TABLE holidays
  ALTER COLUMN calendar_year SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_holidays_calendar_year'
  ) THEN
    ALTER TABLE holidays
      ADD CONSTRAINT fk_holidays_calendar_year
      FOREIGN KEY (calendar_year)
      REFERENCES holiday_calendars (year)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_holidays_calendar_year_matches_date'
  ) THEN
    ALTER TABLE holidays
      ADD CONSTRAINT chk_holidays_calendar_year_matches_date
      CHECK (calendar_year = EXTRACT(YEAR FROM holiday_date)::INTEGER);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_holidays_calendar_year
  ON holidays (calendar_year);

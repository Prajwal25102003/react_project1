-- Holiday calendar release tracking (year-level publish workflow).
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT).

CREATE TABLE IF NOT EXISTS holiday_calendars (
  year INTEGER PRIMARY KEY CHECK (year >= 2000 AND year <= 2100),
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'released')),
  released_at TIMESTAMPTZ,
  released_by VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holiday_calendars_status
  ON holiday_calendars (status);

-- Existing 2026 seed data is treated as already released.
INSERT INTO holiday_calendars (year, status, released_at)
VALUES (2026, 'released', NOW())
ON CONFLICT (year) DO NOTHING;

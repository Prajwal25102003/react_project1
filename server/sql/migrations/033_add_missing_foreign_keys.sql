-- Add missing foreign keys across EMS tables.
-- Cleans orphan references first so constraints can be applied.
-- Safe to re-run (guarded DO blocks / IF NOT EXISTS).

-- ---------------------------------------------------------------------------
-- 1) leave_approval_history → users / employees
-- ---------------------------------------------------------------------------
UPDATE leave_approval_history h
SET actor_employee_id = NULL
WHERE h.actor_employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.id = h.actor_employee_id
  );

UPDATE leave_approval_history h
SET actor_user_id = NULL
WHERE h.actor_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = h.actor_user_id
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_leave_approval_history_actor_employee'
  ) THEN
    ALTER TABLE leave_approval_history
      ADD CONSTRAINT fk_leave_approval_history_actor_employee
      FOREIGN KEY (actor_employee_id)
      REFERENCES employees (id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_leave_approval_history_actor_user'
  ) THEN
    ALTER TABLE leave_approval_history
      ADD CONSTRAINT fk_leave_approval_history_actor_user
      FOREIGN KEY (actor_user_id)
      REFERENCES users (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) recent_activities → employees (subject / actor)
-- ---------------------------------------------------------------------------
UPDATE recent_activities r
SET subject_employee_id = NULL
WHERE r.subject_employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.id = r.subject_employee_id
  );

UPDATE recent_activities r
SET actor_employee_id = NULL
WHERE r.actor_employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.id = r.actor_employee_id
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_recent_activities_subject_employee'
  ) THEN
    ALTER TABLE recent_activities
      ADD CONSTRAINT fk_recent_activities_subject_employee
      FOREIGN KEY (subject_employee_id)
      REFERENCES employees (id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_recent_activities_actor_employee'
  ) THEN
    ALTER TABLE recent_activities
      ADD CONSTRAINT fk_recent_activities_actor_employee
      FOREIGN KEY (actor_employee_id)
      REFERENCES employees (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) holiday_calendars.released_by → users (VARCHAR user-id → INTEGER FK)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'holiday_calendars'
      AND column_name = 'released_by'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE holiday_calendars
      ADD COLUMN IF NOT EXISTS released_by_user_id INTEGER;

    UPDATE holiday_calendars hc
    SET released_by_user_id = hc.released_by::INTEGER
    WHERE hc.released_by IS NOT NULL
      AND hc.released_by ~ '^[0-9]+$'
      AND EXISTS (
        SELECT 1 FROM users u WHERE u.id = hc.released_by::INTEGER
      );

    ALTER TABLE holiday_calendars DROP COLUMN released_by;
    ALTER TABLE holiday_calendars RENAME COLUMN released_by_user_id TO released_by;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_holiday_calendars_released_by_user'
  ) THEN
    ALTER TABLE holiday_calendars
      ADD CONSTRAINT fk_holiday_calendars_released_by_user
      FOREIGN KEY (released_by)
      REFERENCES users (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Subject/actor + event meta so notifications can show sent vs received wording.
ALTER TABLE recent_activities
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(60),
  ADD COLUMN IF NOT EXISTS subject_employee_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS actor_employee_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS meta JSONB;

CREATE INDEX IF NOT EXISTS idx_recent_activities_subject
  ON recent_activities (subject_employee_id)
  WHERE subject_employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recent_activities_actor
  ON recent_activities (actor_employee_id)
  WHERE actor_employee_id IS NOT NULL;

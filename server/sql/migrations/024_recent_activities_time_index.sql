-- Speed recent activity feed ordering on the org dashboard.
CREATE INDEX IF NOT EXISTS idx_recent_activities_time
  ON recent_activities (activity_time DESC);

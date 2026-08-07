-- JWT revocation support: bump token_version to invalidate existing sessions.
-- Safe to re-run.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

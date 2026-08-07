-- Remove recoverable password storage; auth uses password_hash only.
ALTER TABLE users DROP COLUMN IF EXISTS password_vault;

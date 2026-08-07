-- Medical leave supporting document (certificate / prescription).
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

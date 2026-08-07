-- Replace Annual Leave with Casual Leave; keep only Sick / Casual / Maternity.
UPDATE leave_requests
SET leave_type = 'Casual Leave',
    updated_at = NOW()
WHERE leave_type = 'Annual Leave';

-- Normalize any unexpected variants to Casual Leave (optional safety).
UPDATE leave_requests
SET leave_type = 'Casual Leave',
    updated_at = NOW()
WHERE leave_type NOT IN ('Sick Leave', 'Casual Leave', 'Maternity Leave');

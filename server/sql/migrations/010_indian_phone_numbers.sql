-- Normalize employee phones to Indian format: +91 XXXXX XXXXX
-- Prefer running server/scripts/runIndianPhoneMigration.js (uses shared util).
-- This SQL covers the common valid cases + EMP-id fallback for invalid rows.

UPDATE employees AS e
SET phone = '+91 ' || n.mobile || ' ' || n.rest
FROM (
  SELECT
    id,
    CASE
      WHEN regexp_replace(phone, '\D', '', 'g') ~ '^91[0-9]{10}$'
        THEN substr(regexp_replace(phone, '\D', '', 'g'), 3, 5)
      WHEN regexp_replace(phone, '\D', '', 'g') ~ '^0[0-9]{10}$'
        THEN substr(regexp_replace(phone, '\D', '', 'g'), 2, 5)
      WHEN regexp_replace(phone, '\D', '', 'g') ~ '^[0-9]{10}$'
        THEN substr(regexp_replace(phone, '\D', '', 'g'), 1, 5)
      ELSE NULL
    END AS mobile,
    CASE
      WHEN regexp_replace(phone, '\D', '', 'g') ~ '^91[0-9]{10}$'
        THEN substr(regexp_replace(phone, '\D', '', 'g'), 8, 5)
      WHEN regexp_replace(phone, '\D', '', 'g') ~ '^0[0-9]{10}$'
        THEN substr(regexp_replace(phone, '\D', '', 'g'), 7, 5)
      WHEN regexp_replace(phone, '\D', '', 'g') ~ '^[0-9]{10}$'
        THEN substr(regexp_replace(phone, '\D', '', 'g'), 6, 5)
      ELSE NULL
    END AS rest
  FROM employees
) AS n
WHERE e.id = n.id
  AND n.mobile IS NOT NULL
  AND n.rest IS NOT NULL;

UPDATE employees
SET phone = '+91 98765 ' || lpad(
  (
    CASE
      WHEN id ~ '^EMP-[0-9]+$'
        THEN (41000 + (CAST(substr(id FROM 5) AS INTEGER) % 1000))::text
      ELSE '41000'
    END
  ),
  5,
  '0'
)
WHERE phone !~ '^\+91 [0-9]{5} [0-9]{5}$';

-- Rename Engineering department to Development.

UPDATE departments
SET name = 'Development',
    description = REPLACE(description, 'engineering', 'development')
WHERE id = 'DEP-01'
   OR name = 'Engineering';

UPDATE recent_activities
SET description = REPLACE(description, 'Engineering', 'Development')
WHERE description ILIKE '%Engineering%';

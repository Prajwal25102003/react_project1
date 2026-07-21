-- Drop Company Holiday / Company Event from the holiday calendar.

DELETE FROM holidays
WHERE holiday_type IN ('Company Holiday', 'Company Event');

ALTER TABLE holidays
  DROP CONSTRAINT IF EXISTS holidays_holiday_type_check;

ALTER TABLE holidays
  ADD CONSTRAINT holidays_holiday_type_check
  CHECK (holiday_type IN (
    'National Holiday',
    'Optional Holiday',
    'Festival Holiday'
  ));

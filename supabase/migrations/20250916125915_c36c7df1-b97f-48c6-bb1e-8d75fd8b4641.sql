-- Force update renewal dates since the previous update didn't work
UPDATE contracts 
SET renewal_date = (end_date - INTERVAL '3 months')::date
WHERE renewal_date IS NULL AND end_date IS NOT NULL;
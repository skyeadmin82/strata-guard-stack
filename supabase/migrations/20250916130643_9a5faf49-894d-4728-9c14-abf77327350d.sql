-- Fix expired contracts status and update to current dates for demo
UPDATE contracts 
SET 
  status = 'expired',
  end_date = '2025-12-31',
  start_date = '2025-01-01', 
  renewal_date = '2025-10-01'
WHERE end_date < CURRENT_DATE AND status = 'active';

-- Update one contract to be currently active for demo
UPDATE contracts 
SET 
  status = 'active',
  end_date = '2025-12-31',
  start_date = '2025-01-01',
  renewal_date = '2025-10-01'
WHERE contract_number = 'MSP-2025-1001';

-- Keep others as realistic demo data with different statuses
UPDATE contracts 
SET 
  status = 'active',
  end_date = '2026-06-30',
  start_date = '2025-01-01',
  renewal_date = '2026-03-30'
WHERE contract_number = 'MSP-2025-1002';

UPDATE contracts 
SET 
  status = 'pending_approval',
  end_date = '2025-11-30',
  start_date = '2025-02-01',
  renewal_date = '2025-08-30'
WHERE contract_number = 'MSP-2025-1003';
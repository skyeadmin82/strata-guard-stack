-- Fix enum usage in assessments migration - remove invalid 'draft' status
-- Update any existing records that might have invalid status values
UPDATE assessments 
SET status = 'in_progress'::response_status 
WHERE status::text NOT IN ('completed', 'flagged', 'in_progress', 'validated');

-- Delete existing demo data first
DELETE FROM assessments WHERE id IN (
  SELECT a.id FROM assessments a
  JOIN assessment_templates t ON a.template_id = t.id
  WHERE a.created_at > now() - interval '1 hour'
);

-- Recreate demo assessments with correct enum values
INSERT INTO assessments (
  tenant_id,
  client_id,
  template_id,
  status,
  current_question,
  total_score,
  max_possible_score,
  percentage_score,
  started_at,
  created_at,
  updated_at
)
SELECT 
  c.tenant_id,
  c.id as client_id,
  t.id as template_id,
  CASE 
    WHEN random() < 0.4 THEN 'in_progress'::response_status
    WHEN random() < 0.7 THEN 'completed'::response_status
    ELSE 'validated'::response_status
  END as status,
  FLOOR(random() * 10 + 1)::integer as current_question,
  FLOOR(random() * 80 + 20) as total_score,
  100 as max_possible_score,
  FLOOR(random() * 80 + 20) as percentage_score,
  now() - (random() * interval '7 days') as started_at,
  now() - (random() * interval '10 days') as created_at,
  now() - (random() * interval '5 days') as updated_at
FROM clients c
CROSS JOIN assessment_templates t
WHERE c.tenant_id IS NOT NULL 
  AND t.tenant_id IS NOT NULL
  AND c.tenant_id = t.tenant_id
LIMIT 5;
-- Create some demo assessments for testing
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
    WHEN random() < 0.3 THEN 'in_progress'
    WHEN random() < 0.6 THEN 'completed'
    ELSE 'draft'
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
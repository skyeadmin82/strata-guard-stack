-- Clean up duplicate and incomplete templates
-- First, migrate any assessments using the incomplete template to the complete one
UPDATE assessments 
SET template_id = 'd59009a1-5d23-44fb-9980-e3d4fb73facc'
WHERE template_id = '76f9a3ed-e8aa-45e6-ac32-322ce3deaef1';

-- Delete the incomplete template and its single question
DELETE FROM assessment_questions WHERE template_id = '76f9a3ed-e8aa-45e6-ac32-322ce3deaef1';
DELETE FROM assessment_templates WHERE id = '76f9a3ed-e8aa-45e6-ac32-322ce3deaef1';

-- Also remove the unused global templates that have tenant_id = '00000000-0000-0000-0000-000000000000'
DELETE FROM assessment_questions WHERE template_id = '6808dd5f-affd-4dcb-b144-b2e234b12e7e';
DELETE FROM assessment_templates WHERE id = '6808dd5f-affd-4dcb-b144-b2e234b12e7e';

-- Fix the missing question_number 1 in the main template
INSERT INTO public.assessment_questions (
  tenant_id, template_id, question_number, section, question_text, question_type, 
  options, max_points, required, scoring_weight, help_text
) VALUES 
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 1, 'Network Security', 'How would you rate your current network security measures?', 'multiple_choice', 
 '[{"label": "Excellent - Enterprise-grade security", "value": 5}, {"label": "Good - Above average security", "value": 4}, {"label": "Fair - Basic security measures", "value": 3}, {"label": "Poor - Minimal security", "value": 1}, {"label": "None - No security measures", "value": 0}]', 5, true, 1, 'Network security is the foundation of IT infrastructure protection');

-- Create some sample assessment opportunities for existing completed assessments
INSERT INTO public.assessment_opportunities (
  tenant_id, assessment_id, client_id, opportunity_type, title, description, 
  priority, status, estimated_value, currency, detection_rules
) 
SELECT 
  a.tenant_id,
  a.id,
  a.client_id,
  'security_improvement',
  'Network Security Enhancement',
  'Based on assessment results, implementing advanced network security measures could significantly improve your IT security posture.',
  CASE 
    WHEN a.percentage_score < 70 THEN 'high'::opportunity_priority
    WHEN a.percentage_score < 85 THEN 'medium'::opportunity_priority
    ELSE 'low'::opportunity_priority
  END,
  'identified'::opportunity_status,
  CASE 
    WHEN a.percentage_score < 70 THEN 15000
    WHEN a.percentage_score < 85 THEN 8000
    ELSE 3000
  END,
  'USD',
  '{"threshold": 70, "section": "Network Security"}'::jsonb
FROM assessments a 
WHERE a.status = 'completed' AND a.percentage_score IS NOT NULL;

-- Create backup improvement opportunities
INSERT INTO public.assessment_opportunities (
  tenant_id, assessment_id, client_id, opportunity_type, title, description, 
  priority, status, estimated_value, currency, detection_rules
) 
SELECT 
  a.tenant_id,
  a.id,
  a.client_id,
  'backup_improvement',
  'Backup & Recovery Enhancement',
  'Enhance your backup strategy with automated testing and more frequent backup schedules to ensure business continuity.',
  CASE 
    WHEN a.percentage_score < 80 THEN 'high'::opportunity_priority
    ELSE 'medium'::opportunity_priority
  END,
  'identified'::opportunity_status,
  CASE 
    WHEN a.percentage_score < 80 THEN 12000
    ELSE 6000
  END,
  'USD',
  '{"threshold": 80, "section": "Backup & Recovery"}'::jsonb
FROM assessments a 
WHERE a.status = 'completed' AND a.percentage_score IS NOT NULL AND a.percentage_score < 90;

-- Generate action items from opportunities
INSERT INTO public.action_items (
  tenant_id, assessment_id, title, description, category, priority, status,
  estimated_effort, estimated_value, due_date, created_by, findings, recommendations
)
SELECT 
  ao.tenant_id,
  ao.assessment_id,
  ao.title,
  ao.description,
  'Security' as category,
  ao.priority::text,
  'open',
  CASE 
    WHEN ao.priority = 'high' THEN 40
    WHEN ao.priority = 'medium' THEN 20
    ELSE 10
  END as estimated_effort,
  ao.estimated_value,
  CURRENT_DATE + INTERVAL '30 days' as due_date,
  (SELECT created_by FROM assessments WHERE id = ao.assessment_id LIMIT 1),
  ARRAY['Assessment identified areas for improvement'],
  ARRAY[ao.description]
FROM assessment_opportunities ao;
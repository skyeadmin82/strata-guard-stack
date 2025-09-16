-- Create some sample assessment responses for testing
-- First, let's get an assessment to work with
INSERT INTO public.assessment_responses (
  tenant_id, assessment_id, question_id, response_value, score, response_data
)
SELECT 
  '53ffcba2-59e1-4189-8271-600d5ada2a99',
  '633e9713-2438-4634-a776-8c2f07dd6f0f', -- One of the completed assessments
  aq.id,
  '4', -- Good rating
  4,
  '{"selectedValue": 4}'::jsonb
FROM assessment_questions aq 
WHERE aq.template_id = 'd59009a1-5d23-44fb-9980-e3d4fb73facc'
AND aq.question_number <= 10 -- First 10 questions
ORDER BY aq.question_number;

-- Add more varied responses for the same assessment
INSERT INTO public.assessment_responses (
  tenant_id, assessment_id, question_id, response_value, score, response_data
)
SELECT 
  '53ffcba2-59e1-4189-8271-600d5ada2a99',
  '633e9713-2438-4634-a776-8c2f07dd6f0f',
  aq.id,
  CASE 
    WHEN aq.question_number % 3 = 0 THEN '5' -- Excellent
    WHEN aq.question_number % 3 = 1 THEN '3' -- Fair
    ELSE '4' -- Good
  END,
  CASE 
    WHEN aq.question_number % 3 = 0 THEN 5
    WHEN aq.question_number % 3 = 1 THEN 3
    ELSE 4
  END,
  CASE 
    WHEN aq.question_number % 3 = 0 THEN '{"selectedValue": 5}'::jsonb
    WHEN aq.question_number % 3 = 1 THEN '{"selectedValue": 3}'::jsonb
    ELSE '{"selectedValue": 4}'::jsonb
  END
FROM assessment_questions aq 
WHERE aq.template_id = 'd59009a1-5d23-44fb-9980-e3d4fb73facc'
AND aq.question_number > 10 -- Remaining questions
ORDER BY aq.question_number;

-- Create sample scheduled assessments for demo
INSERT INTO public.scheduled_assessments (
  tenant_id, client_id, template_id, scheduled_date, assigned_to, notes, frequency, status
) VALUES 
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'd2699670-5c3e-468e-9d7d-4925d5eaca1e', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 
 CURRENT_DATE + INTERVAL '7 days', 'IT Security Team', 'Quarterly security assessment', 'quarterly', 'scheduled'),
('53ffcba2-59e1-4189-8271-600d5ada2a99', '50345e5d-6339-4ac2-ae7c-e09a2eec687b', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 
 CURRENT_DATE + INTERVAL '14 days', 'MSP Team', 'Follow-up assessment after improvements', 'once', 'scheduled'),
('53ffcba2-59e1-4189-8271-600d5ada2a99', '84150132-4152-473d-87a6-9d1a5aa03da9', 'd59009a1-5d23-44fb-9980-e3d4fb73facc', 
 CURRENT_DATE + INTERVAL '30 days', 'Senior Analyst', 'Annual comprehensive review', 'annually', 'scheduled');

-- Update assessment total scores based on actual responses
UPDATE assessments 
SET 
  total_score = (
    SELECT COALESCE(SUM(ar.score), 0) 
    FROM assessment_responses ar 
    WHERE ar.assessment_id = assessments.id
  ),
  percentage_score = (
    SELECT CASE 
      WHEN COUNT(ar.id) > 0 THEN (SUM(ar.score) * 100.0 / 100) -- Assuming max 100 points
      ELSE assessments.percentage_score 
    END
    FROM assessment_responses ar 
    WHERE ar.assessment_id = assessments.id
  )
WHERE id = '633e9713-2438-4634-a776-8c2f07dd6f0f';

-- Create assessment error log entries for testing
INSERT INTO public.assessment_error_logs (
  tenant_id, assessment_id, error_type, error_message, severity, context
) VALUES 
('53ffcba2-59e1-4189-8271-600d5ada2a99', '633e9713-2438-4634-a776-8c2f07dd6f0f', 
 'validation_warning', 'Question response outside expected range', 'warning',
 '{"question_id": "some-id", "response_value": "6", "max_expected": 5}'::jsonb),
('53ffcba2-59e1-4189-8271-600d5ada2a99', 'ddf32399-3f94-4a19-b7e3-89768f708a74',
 'save_error', 'Failed to auto-save response after network timeout', 'error',
 '{"question_number": 5, "retry_count": 3, "last_error": "network_timeout"}'::jsonb);
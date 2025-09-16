-- Add health score and tracking fields to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now();
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'low';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS satisfaction_rating integer DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS response_time_avg_hours integer DEFAULT 0;

-- Create client activity log table for timeline
CREATE TABLE IF NOT EXISTS public.client_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_title text NOT NULL,
  activity_description text,
  activity_data jsonb DEFAULT '{}',
  performed_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on client activities
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client activities
CREATE POLICY "Users can manage client activities in their tenant"
ON public.client_activities
FOR ALL
USING (tenant_id = get_current_user_tenant_id());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON public.client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_created_at ON public.client_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_health_score ON public.clients(health_score);
CREATE INDEX IF NOT EXISTS idx_clients_last_activity ON public.clients(last_activity_at);

-- Create client stats view for quick calculations
CREATE OR REPLACE VIEW public.client_stats AS
SELECT 
  c.id,
  c.name,
  c.health_score,
  c.last_activity_at,
  c.risk_level,
  c.satisfaction_rating,
  COALESCE(ticket_stats.total_tickets, 0) as total_tickets,
  COALESCE(ticket_stats.open_tickets, 0) as open_tickets,
  COALESCE(contract_stats.active_contracts, 0) as active_contracts,
  COALESCE(contract_stats.total_value, 0) as total_contract_value,
  COALESCE(contact_stats.contact_count, 0) as contact_count,
  COALESCE(assessment_stats.avg_score, 0) as avg_assessment_score,
  COALESCE(activity_stats.recent_activities, 0) as recent_activities
FROM public.clients c
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE status IN ('submitted', 'in_review', 'in_progress', 'pending_client')) as open_tickets
  FROM public.support_tickets 
  GROUP BY client_id
) ticket_stats ON c.id = ticket_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as active_contracts,
    COALESCE(SUM(total_value), 0) as total_value
  FROM public.contracts 
  WHERE status = 'active'
  GROUP BY client_id
) contract_stats ON c.id = contract_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as contact_count
  FROM public.contacts 
  WHERE is_active = true
  GROUP BY client_id
) contact_stats ON c.id = contact_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    AVG(percentage_score) as avg_score
  FROM public.assessments 
  WHERE status = 'completed'
  GROUP BY client_id
) assessment_stats ON c.id = assessment_stats.client_id
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as recent_activities
  FROM public.client_activities 
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY client_id
) activity_stats ON c.id = activity_stats.client_id;

-- Function to calculate client health score
CREATE OR REPLACE FUNCTION public.calculate_client_health_score(client_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score integer := 0;
  ticket_health integer := 0;
  contract_health integer := 0;
  activity_health integer := 0;
  assessment_health integer := 0;
  client_record record;
BEGIN
  -- Get client stats
  SELECT * INTO client_record FROM client_stats WHERE id = client_uuid;
  
  -- Ticket health (30 points max)
  IF client_record.total_tickets = 0 THEN
    ticket_health := 30; -- No tickets is good
  ELSE
    -- Lower percentage of open tickets = better health
    ticket_health := GREATEST(0, 30 - (client_record.open_tickets * 30 / GREATEST(client_record.total_tickets, 1)));
  END IF;
  
  -- Contract health (25 points max)
  IF client_record.active_contracts > 0 THEN
    contract_health := LEAST(25, client_record.active_contracts * 8); -- More contracts = better health
  END IF;
  
  -- Activity health (25 points max)
  IF client_record.recent_activities > 10 THEN
    activity_health := 25;
  ELSE
    activity_health := client_record.recent_activities * 2.5;
  END IF;
  
  -- Assessment health (20 points max)
  IF client_record.avg_assessment_score > 0 THEN
    assessment_health := (client_record.avg_assessment_score * 20 / 100);
  END IF;
  
  score := ticket_health + contract_health + activity_health + assessment_health;
  
  -- Update client health score
  UPDATE public.clients 
  SET health_score = score,
      risk_level = CASE 
        WHEN score >= 80 THEN 'low'
        WHEN score >= 50 THEN 'medium'
        ELSE 'high'
      END
  WHERE id = client_uuid;
  
  RETURN score;
END;
$$;

-- Trigger to update client activity timestamp
CREATE OR REPLACE FUNCTION public.update_client_last_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.clients 
  SET last_activity_at = now() 
  WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;
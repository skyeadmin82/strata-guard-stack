-- Update calculate_sla_due_date function to work with ticket_priority enum
CREATE OR REPLACE FUNCTION public.calculate_sla_due_date(ticket_priority ticket_priority, tenant_uuid uuid)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sla_rule record;
  due_date timestamp with time zone;
BEGIN
  -- Get SLA rule for this priority
  SELECT * INTO sla_rule 
  FROM sla_rules 
  WHERE tenant_id = tenant_uuid 
    AND priority = ticket_priority::text 
    AND is_active = true
  LIMIT 1;
  
  -- If no specific rule found, use default (24 hours response, 72 hours resolution)
  IF NOT FOUND THEN
    due_date := now() + INTERVAL '72 hours';
  ELSE
    due_date := now() + (sla_rule.resolution_time_hours || ' hours')::INTERVAL;
  END IF;
  
  RETURN due_date;
END;
$function$;
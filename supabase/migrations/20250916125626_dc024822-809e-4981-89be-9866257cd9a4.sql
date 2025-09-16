-- Fix contract renewal dates for existing contracts
UPDATE contracts 
SET renewal_date = CASE 
  WHEN end_date IS NOT NULL THEN (end_date - INTERVAL '3 months')::date
  WHEN start_date IS NOT NULL THEN (start_date + INTERVAL '9 months')::date
  ELSE (CURRENT_DATE + INTERVAL '9 months')::date
END
WHERE renewal_date IS NULL AND auto_renewal = true;

-- Update expired contracts status
UPDATE contracts 
SET status = 'expired'
WHERE end_date < CURRENT_DATE AND status = 'active';

-- Create contract templates table if not exists (for the enhancement)
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  contract_type contract_type NOT NULL,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  default_pricing_type pricing_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on contract_templates
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for contract_templates
CREATE POLICY "Users can manage contract templates in their tenant" 
ON contract_templates 
FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create trigger for contract_templates updated_at
CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON contract_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
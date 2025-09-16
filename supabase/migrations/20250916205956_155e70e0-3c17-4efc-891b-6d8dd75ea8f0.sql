-- Add RLS policies for integration tables
ALTER TABLE integration_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS policies for integration_providers
CREATE POLICY "Users can manage integration providers in their tenant"
ON integration_providers
FOR ALL
USING (tenant_id = get_current_user_tenant_id());

-- RLS policies for integration_connections  
CREATE POLICY "Users can manage integration connections in their tenant"
ON integration_connections
FOR ALL
USING (tenant_id = get_current_user_tenant_id());

-- RLS policies for integration_sync_jobs
CREATE POLICY "Users can manage integration sync jobs in their tenant"
ON integration_sync_jobs
FOR ALL
USING (tenant_id = get_current_user_tenant_id());

-- RLS policies for integration_alerts
CREATE POLICY "Users can manage integration alerts in their tenant"
ON integration_alerts
FOR ALL
USING (tenant_id = get_current_user_tenant_id());

-- RLS policies for integration_webhooks
CREATE POLICY "Users can manage integration webhooks in their tenant"
ON integration_webhooks
FOR ALL
USING (tenant_id = get_current_user_tenant_id());

-- Create function to initialize default integration providers
CREATE OR REPLACE FUNCTION public.initialize_default_integrations(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default integration providers if they don't exist
  INSERT INTO integration_providers (tenant_id, name, provider_type, description, auth_type, status, version, oauth_config, api_config, webhook_config, rate_limits, timeout_seconds, retry_config)
  VALUES 
    (p_tenant_id, 'QuickBooks Online', 'accounting', 'Sync invoices, payments, and financial data', 'oauth2', 'available', '1.0', 
     '{"client_id": "", "client_secret": "", "scope": "com.intuit.quickbooks.accounting", "redirect_uri": ""}',
     '{"base_url": "https://sandbox-quickbooks.api.intuit.com", "version": "v3"}',
     '{"webhook_url": "", "verification_token": ""}',
     '{"requests_per_minute": 500, "requests_per_day": 10000}',
     30,
     '{"max_attempts": 3, "delay_seconds": [60, 300, 900]}'
    ),
    (p_tenant_id, 'PCBancard', 'payment', 'Accept payments with dual pricing and platform billing', 'api_key', 'available', '1.0',
     '{}',
     '{"base_url": "https://api.pcbancard.com", "version": "v1"}',
     '{"webhook_url": "", "verification_token": ""}',
     '{"requests_per_minute": 100, "requests_per_day": 5000}',
     30,
     '{"max_attempts": 3, "delay_seconds": [60, 300, 900]}'
    ),
    (p_tenant_id, 'SMTP2GO', 'email', 'Email automation and transactional emails', 'api_key', 'available', '1.0',
     '{}',
     '{"base_url": "https://api.smtp2go.com", "version": "v3"}',
     '{"webhook_url": "", "verification_token": ""}',
     '{"requests_per_minute": 1000, "requests_per_day": 50000}',
     30,
     '{"max_attempts": 3, "delay_seconds": [60, 300, 900]}'
    ),
    (p_tenant_id, 'Microsoft Teams', 'communication', 'Team collaboration and ticket notifications', 'oauth2', 'available', '1.0',
     '{"client_id": "", "client_secret": "", "scope": "https://graph.microsoft.com/.default", "redirect_uri": ""}',
     '{"base_url": "https://graph.microsoft.com", "version": "v1.0"}',
     '{"webhook_url": "", "verification_token": ""}',
     '{"requests_per_minute": 600, "requests_per_day": 20000}',
     30,
     '{"max_attempts": 3, "delay_seconds": [60, 300, 900]}'
    ),
    (p_tenant_id, 'Azure Active Directory', 'authentication', 'Single sign-on and user management', 'oauth2', 'available', '1.0',
     '{"client_id": "", "client_secret": "", "scope": "https://graph.microsoft.com/.default", "redirect_uri": ""}',
     '{"base_url": "https://graph.microsoft.com", "version": "v1.0"}',
     '{"webhook_url": "", "verification_token": ""}',
     '{"requests_per_minute": 600, "requests_per_day": 20000}',
     30,
     '{"max_attempts": 3, "delay_seconds": [60, 300, 900]}'
    )
  ON CONFLICT (tenant_id, name) DO NOTHING;
END;
$$;

-- Create function to get integration status for a tenant
CREATE OR REPLACE FUNCTION public.get_integration_status(p_tenant_id uuid, p_provider_name text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  connection_status text;
BEGIN
  SELECT 
    CASE 
      WHEN ic.auth_status = 'connected' AND ic.connection_status = 'healthy' THEN 'connected'
      WHEN ic.auth_status = 'connected' AND ic.connection_status != 'healthy' THEN 'error'
      WHEN ip.status = 'available' THEN 'available'
      ELSE 'coming_soon'
    END
  INTO connection_status
  FROM integration_providers ip
  LEFT JOIN integration_connections ic ON ip.id = ic.provider_id AND ic.tenant_id = p_tenant_id
  WHERE ip.tenant_id = p_tenant_id AND ip.name = p_provider_name
  LIMIT 1;
  
  RETURN COALESCE(connection_status, 'coming_soon');
END;
$$;
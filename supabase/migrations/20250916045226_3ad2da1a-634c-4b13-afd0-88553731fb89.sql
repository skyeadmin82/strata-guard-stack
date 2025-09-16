-- Integration Platform Database Schema

-- Integration Providers Table
CREATE TABLE public.integration_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(100) NOT NULL, -- 'quickbooks', 'stripe', 'hubspot', etc.
  description TEXT,
  base_url VARCHAR(500),
  auth_type VARCHAR(50) NOT NULL, -- 'oauth2', 'api_key', 'basic'
  oauth_config JSONB DEFAULT '{}',
  api_config JSONB DEFAULT '{}',
  webhook_config JSONB DEFAULT '{}',
  rate_limits JSONB DEFAULT '{"requests_per_minute": 60, "requests_per_hour": 1000}',
  timeout_seconds INTEGER DEFAULT 30,
  retry_config JSONB DEFAULT '{"max_attempts": 3, "backoff_seconds": [1, 5, 15]}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
  version VARCHAR(20) DEFAULT '1.0',
  deprecated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Integration Connections Table
CREATE TABLE public.integration_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider_id UUID REFERENCES public.integration_providers(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Authentication
  auth_status VARCHAR(50) DEFAULT 'disconnected' CHECK (auth_status IN ('connected', 'disconnected', 'expired', 'error')),
  credentials JSONB DEFAULT '{}', -- Encrypted auth tokens, refresh tokens, etc.
  oauth_state VARCHAR(255),
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Connection Health
  connection_status VARCHAR(50) DEFAULT 'healthy' CHECK (connection_status IN ('healthy', 'degraded', 'unhealthy', 'maintenance')),
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_check_errors JSONB DEFAULT '[]',
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Sync Configuration
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency VARCHAR(50) DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily', 'weekly', 'manual'
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'idle' CHECK (sync_status IN ('idle', 'running', 'failed', 'paused')),
  
  -- Field Mappings
  field_mappings JSONB DEFAULT '{}',
  sync_settings JSONB DEFAULT '{}',
  
  -- Error Handling
  error_count INTEGER DEFAULT 0,
  last_error JSONB,
  error_threshold INTEGER DEFAULT 10,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- API Gateway Endpoints Table
CREATE TABLE public.api_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  path VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  description TEXT,
  
  -- Validation
  request_schema JSONB DEFAULT '{}',
  response_schema JSONB DEFAULT '{}',
  validation_enabled BOOLEAN DEFAULT true,
  
  -- Rate Limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Authentication
  auth_required BOOLEAN DEFAULT true,
  allowed_roles JSONB DEFAULT '["admin"]',
  api_key_required BOOLEAN DEFAULT false,
  
  -- Monitoring
  is_active BOOLEAN DEFAULT true,
  deprecated BOOLEAN DEFAULT false,
  deprecation_date TIMESTAMP WITH TIME ZONE,
  replacement_endpoint VARCHAR(500),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(tenant_id, path, method, version)
);

-- API Request Logs Table
CREATE TABLE public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  endpoint_id UUID REFERENCES public.api_endpoints(id),
  
  -- Request Details
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  query_params JSONB DEFAULT '{}',
  headers JSONB DEFAULT '{}',
  body JSONB,
  
  -- Response Details
  status_code INTEGER,
  response_body JSONB,
  response_headers JSONB DEFAULT '{}',
  
  -- Timing
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  response_timestamp TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  -- Client Info
  client_ip INET,
  user_agent TEXT,
  user_id UUID,
  api_key_id UUID,
  
  -- Error Info
  error_message TEXT,
  error_stack TEXT,
  
  -- Rate Limiting
  rate_limit_hit BOOLEAN DEFAULT false,
  rate_limit_remaining INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Integration Sync Jobs Table
CREATE TABLE public.integration_sync_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  connection_id UUID REFERENCES public.integration_connections(id),
  
  -- Job Details
  job_type VARCHAR(100) NOT NULL, -- 'full_sync', 'incremental_sync', 'webhook_sync'
  sync_direction VARCHAR(50) DEFAULT 'bidirectional', -- 'inbound', 'outbound', 'bidirectional'
  priority INTEGER DEFAULT 5, -- 1-10, higher = more priority
  
  -- Status
  status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled', 'retry')),
  progress_percentage INTEGER DEFAULT 0,
  
  -- Data
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  
  -- Timing
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  
  -- Results
  sync_results JSONB DEFAULT '{}',
  error_details JSONB DEFAULT '[]',
  conflict_resolution JSONB DEFAULT '{}',
  
  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Integration Webhooks Table
CREATE TABLE public.integration_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  connection_id UUID REFERENCES public.integration_connections(id),
  
  -- Webhook Config
  endpoint_url VARCHAR(500) NOT NULL,
  webhook_secret VARCHAR(255),
  signature_header VARCHAR(100) DEFAULT 'X-Signature',
  signature_algorithm VARCHAR(50) DEFAULT 'sha256',
  
  -- Events
  supported_events JSONB DEFAULT '[]',
  event_filters JSONB DEFAULT '{}',
  
  -- Delivery
  delivery_timeout INTEGER DEFAULT 30,
  retry_attempts INTEGER DEFAULT 3,
  retry_delays JSONB DEFAULT '[60, 300, 900]', -- seconds
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  delivery_success_rate NUMERIC DEFAULT 100.0,
  consecutive_failures INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Webhook Delivery Logs Table
CREATE TABLE public.webhook_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  webhook_id UUID REFERENCES public.integration_webhooks(id),
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Delivery Attempt
  attempt_number INTEGER DEFAULT 1,
  delivery_url VARCHAR(500) NOT NULL,
  
  -- Request/Response
  request_headers JSONB DEFAULT '{}',
  request_body JSONB,
  response_code INTEGER,
  response_headers JSONB DEFAULT '{}',
  response_body TEXT,
  
  -- Timing
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  error_message TEXT,
  
  -- Retry Logic
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Data Mapping Templates Table
CREATE TABLE public.data_mapping_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provider_id UUID REFERENCES public.integration_providers(id),
  
  -- Template Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(100) NOT NULL, -- 'customer', 'invoice', 'product', etc.
  
  -- Mapping Configuration
  field_mappings JSONB NOT NULL DEFAULT '{}',
  transformation_rules JSONB DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  
  -- Conflict Resolution
  duplicate_detection_rules JSONB DEFAULT '{}',
  merge_strategies JSONB DEFAULT '{}',
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Integration Monitoring Alerts Table
CREATE TABLE public.integration_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  connection_id UUID REFERENCES public.integration_connections(id),
  
  -- Alert Details
  alert_type VARCHAR(100) NOT NULL, -- 'connection_failed', 'sync_failed', 'rate_limit', 'auth_expired'
  severity VARCHAR(50) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Context
  context_data JSONB DEFAULT '{}',
  affected_records INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'muted')),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Notification
  notification_sent BOOLEAN DEFAULT false,
  notification_channels JSONB DEFAULT '["email"]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.integration_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage integration providers in their tenant" 
ON public.integration_providers FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage integration connections in their tenant" 
ON public.integration_connections FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage API endpoints in their tenant" 
ON public.api_endpoints FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view API request logs in their tenant" 
ON public.api_request_logs FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage integration sync jobs in their tenant" 
ON public.integration_sync_jobs FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage integration webhooks in their tenant" 
ON public.integration_webhooks FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view webhook delivery logs in their tenant" 
ON public.webhook_delivery_logs FOR SELECT 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage data mapping templates in their tenant" 
ON public.data_mapping_templates FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage integration alerts in their tenant" 
ON public.integration_alerts FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create indexes for performance
CREATE INDEX idx_integration_providers_tenant_id ON public.integration_providers(tenant_id);
CREATE INDEX idx_integration_connections_tenant_id ON public.integration_connections(tenant_id);
CREATE INDEX idx_integration_connections_provider_id ON public.integration_connections(provider_id);
CREATE INDEX idx_integration_connections_next_sync ON public.integration_connections(next_sync_at) WHERE sync_enabled = true;

CREATE INDEX idx_api_endpoints_tenant_id ON public.api_endpoints(tenant_id);
CREATE INDEX idx_api_endpoints_path_method ON public.api_endpoints(path, method);

CREATE INDEX idx_api_request_logs_tenant_id ON public.api_request_logs(tenant_id);
CREATE INDEX idx_api_request_logs_timestamp ON public.api_request_logs(request_timestamp);
CREATE INDEX idx_api_request_logs_endpoint_id ON public.api_request_logs(endpoint_id);

CREATE INDEX idx_integration_sync_jobs_tenant_id ON public.integration_sync_jobs(tenant_id);
CREATE INDEX idx_integration_sync_jobs_connection_id ON public.integration_sync_jobs(connection_id);
CREATE INDEX idx_integration_sync_jobs_status ON public.integration_sync_jobs(status);
CREATE INDEX idx_integration_sync_jobs_priority ON public.integration_sync_jobs(priority DESC);

CREATE INDEX idx_integration_webhooks_tenant_id ON public.integration_webhooks(tenant_id);
CREATE INDEX idx_webhook_delivery_logs_webhook_id ON public.webhook_delivery_logs(webhook_id);
CREATE INDEX idx_webhook_delivery_logs_status ON public.webhook_delivery_logs(status);

CREATE INDEX idx_integration_alerts_tenant_id ON public.integration_alerts(tenant_id);
CREATE INDEX idx_integration_alerts_status ON public.integration_alerts(status);
CREATE INDEX idx_integration_alerts_severity ON public.integration_alerts(severity);

-- Create triggers for updated_at
CREATE TRIGGER update_integration_providers_updated_at
  BEFORE UPDATE ON public.integration_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_connections_updated_at
  BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_endpoints_updated_at
  BEFORE UPDATE ON public.api_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_sync_jobs_updated_at
  BEFORE UPDATE ON public.integration_sync_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_webhooks_updated_at
  BEFORE UPDATE ON public.integration_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_mapping_templates_updated_at
  BEFORE UPDATE ON public.data_mapping_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_alerts_updated_at
  BEFORE UPDATE ON public.integration_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
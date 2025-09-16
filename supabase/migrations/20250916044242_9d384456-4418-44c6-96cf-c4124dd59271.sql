-- Email Templates Table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject_template TEXT NOT NULL,
  html_template TEXT,
  text_template TEXT,
  template_variables JSONB DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  category VARCHAR(100),
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  reply_to VARCHAR(255),
  is_system_template BOOLEAN DEFAULT false,
  validation_errors JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email Campaigns Table  
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  template_id UUID REFERENCES public.email_templates(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) DEFAULT 'standard' CHECK (campaign_type IN ('standard', 'ab_test', 'drip', 'trigger')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'failed', 'cancelled')),
  
  -- Scheduling
  send_immediately BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  send_optimization JSONB DEFAULT '{}',
  
  -- A/B Testing
  ab_test_config JSONB DEFAULT '{}',
  ab_test_winner VARCHAR(10),
  
  -- Targeting
  recipient_criteria JSONB DEFAULT '{}',
  recipient_count INTEGER DEFAULT 0,
  
  -- Sending Configuration
  sender_config JSONB DEFAULT '{}',
  delivery_settings JSONB DEFAULT '{}',
  rate_limit_per_hour INTEGER DEFAULT 1000,
  
  -- Tracking
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  
  -- Error Handling
  send_errors JSONB DEFAULT '[]',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Email Recipients Table
CREATE TABLE public.email_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  merge_fields JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  source VARCHAR(100),
  tags TEXT[],
  preferences JSONB DEFAULT '{}',
  
  -- Validation
  email_verified BOOLEAN DEFAULT false,
  email_validation_status VARCHAR(50),
  validation_errors JSONB DEFAULT '[]',
  
  -- Tracking
  total_sends INTEGER DEFAULT 0,
  total_opens INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(tenant_id, email)
);

-- Email Sends Table (Individual Send Tracking)
CREATE TABLE public.email_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.email_campaigns(id),
  recipient_id UUID REFERENCES public.email_recipients(id),
  template_id UUID REFERENCES public.email_templates(id),
  
  -- Message Details
  subject VARCHAR(500),
  from_email VARCHAR(255),
  from_name VARCHAR(255),
  reply_to VARCHAR(255),
  message_id VARCHAR(255),
  smtp_message_id VARCHAR(255),
  
  -- Send Status
  status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'bounced', 'failed', 'rejected')),
  send_attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Timestamps
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  first_clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error Information
  error_code VARCHAR(50),
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  bounce_type VARCHAR(50),
  bounce_reason TEXT,
  
  -- Tracking
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  tracking_pixel_url VARCHAR(500),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email Analytics Table
CREATE TABLE public.email_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  send_id UUID REFERENCES public.email_sends(id),
  campaign_id UUID REFERENCES public.email_campaigns(id),
  recipient_id UUID REFERENCES public.email_recipients(id),
  
  -- Event Details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  event_data JSONB DEFAULT '{}',
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  operating_system VARCHAR(100),
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  
  -- URLs (for clicks)
  url VARCHAR(1000),
  url_title VARCHAR(500),
  
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email Bounces Table
CREATE TABLE public.email_bounces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  send_id UUID REFERENCES public.email_sends(id),
  recipient_id UUID REFERENCES public.email_recipients(id),
  
  -- Bounce Details
  bounce_type VARCHAR(50) NOT NULL CHECK (bounce_type IN ('hard', 'soft', 'complaint', 'suppression')),
  bounce_subtype VARCHAR(100),
  bounce_code VARCHAR(10),
  bounce_reason TEXT,
  smtp_response TEXT,
  
  -- Categorization
  is_permanent BOOLEAN DEFAULT false,
  severity_level INTEGER DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 5),
  should_retry BOOLEAN DEFAULT true,
  
  -- Resolution
  resolution_status VARCHAR(50) DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'investigating', 'resolved', 'suppressed')),
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  bounce_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email Unsubscribes Table
CREATE TABLE public.email_unsubscribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  recipient_id UUID REFERENCES public.email_recipients(id),
  campaign_id UUID REFERENCES public.email_campaigns(id),
  
  -- Unsubscribe Details
  unsubscribe_type VARCHAR(50) DEFAULT 'manual' CHECK (unsubscribe_type IN ('manual', 'automatic', 'complaint', 'bounced')),
  unsubscribe_reason VARCHAR(500),
  unsubscribe_method VARCHAR(50) CHECK (unsubscribe_method IN ('link', 'reply', 'complaint', 'api')),
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Compliance
  compliance_method VARCHAR(50),
  confirmation_sent BOOLEAN DEFAULT false,
  
  unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email Attachments Table
CREATE TABLE public.email_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  template_id UUID REFERENCES public.email_templates(id),
  
  -- File Details
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  file_path VARCHAR(1000),
  file_size BIGINT,
  mime_type VARCHAR(100),
  content_id VARCHAR(255),
  
  -- Validation
  is_valid BOOLEAN DEFAULT true,
  validation_errors JSONB DEFAULT '[]',
  virus_scan_status VARCHAR(50) DEFAULT 'pending',
  virus_scan_result JSONB DEFAULT '{}',
  
  -- Usage
  is_inline BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email Configuration Table
CREATE TABLE public.email_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  
  -- SMTP2GO Configuration
  smtp_settings JSONB DEFAULT '{}',
  api_key_id VARCHAR(255),
  sender_domains TEXT[],
  verified_domains TEXT[],
  
  -- Default Settings
  default_from_email VARCHAR(255),
  default_from_name VARCHAR(255),
  default_reply_to VARCHAR(255),
  
  -- Rate Limits
  hourly_send_limit INTEGER DEFAULT 1000,
  daily_send_limit INTEGER DEFAULT 10000,
  monthly_send_limit INTEGER DEFAULT 100000,
  
  -- Tracking Settings
  enable_open_tracking BOOLEAN DEFAULT true,
  enable_click_tracking BOOLEAN DEFAULT true,
  enable_unsubscribe_tracking BOOLEAN DEFAULT true,
  tracking_domain VARCHAR(255),
  
  -- Compliance Settings
  enable_double_optin BOOLEAN DEFAULT true,
  unsubscribe_footer_template TEXT,
  privacy_policy_url VARCHAR(500),
  
  -- Error Handling
  bounce_webhook_url VARCHAR(500),
  complaint_webhook_url VARCHAR(500),
  delivery_webhook_url VARCHAR(500),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(tenant_id)
);

-- Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_bounces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_configuration ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
-- Email Templates
CREATE POLICY "Users can view their tenant's email templates" 
ON public.email_templates FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create email templates for their tenant" 
ON public.email_templates FOR INSERT 
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their tenant's email templates" 
ON public.email_templates FOR UPDATE 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their tenant's email templates" 
ON public.email_templates FOR DELETE 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Email Campaigns (similar pattern for all tables)
CREATE POLICY "Users can manage their tenant's email campaigns" 
ON public.email_campaigns FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant's email recipients" 
ON public.email_recipients FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant's email sends" 
ON public.email_sends FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant's email analytics" 
ON public.email_analytics FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant's email bounces" 
ON public.email_bounces FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant's email unsubscribes" 
ON public.email_unsubscribes FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant's email attachments" 
ON public.email_attachments FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant's email configuration" 
ON public.email_configuration FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_email_templates_tenant_id ON public.email_templates(tenant_id);
CREATE INDEX idx_email_templates_status ON public.email_templates(status);

CREATE INDEX idx_email_campaigns_tenant_id ON public.email_campaigns(tenant_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled_at ON public.email_campaigns(scheduled_at);

CREATE INDEX idx_email_recipients_tenant_id ON public.email_recipients(tenant_id);
CREATE INDEX idx_email_recipients_email ON public.email_recipients(email);
CREATE INDEX idx_email_recipients_status ON public.email_recipients(status);

CREATE INDEX idx_email_sends_tenant_id ON public.email_sends(tenant_id);
CREATE INDEX idx_email_sends_campaign_id ON public.email_sends(campaign_id);
CREATE INDEX idx_email_sends_status ON public.email_sends(status);
CREATE INDEX idx_email_sends_sent_at ON public.email_sends(sent_at);

CREATE INDEX idx_email_analytics_tenant_id ON public.email_analytics(tenant_id);
CREATE INDEX idx_email_analytics_campaign_id ON public.email_analytics(campaign_id);
CREATE INDEX idx_email_analytics_event_type ON public.email_analytics(event_type);
CREATE INDEX idx_email_analytics_event_timestamp ON public.email_analytics(event_timestamp);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_recipients_updated_at
  BEFORE UPDATE ON public.email_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sends_updated_at
  BEFORE UPDATE ON public.email_sends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_attachments_updated_at
  BEFORE UPDATE ON public.email_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_configuration_updated_at
  BEFORE UPDATE ON public.email_configuration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
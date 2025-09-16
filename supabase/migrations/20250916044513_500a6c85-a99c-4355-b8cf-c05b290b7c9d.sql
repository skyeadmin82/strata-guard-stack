-- Create missing email tables

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

-- Enable RLS on new tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Users can manage their tenant's email templates" 
ON public.email_templates FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant's email sends" 
ON public.email_sends FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their tenant's email unsubscribes" 
ON public.email_unsubscribes FOR ALL 
USING (tenant_id IN (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_email_templates_tenant_id ON public.email_templates(tenant_id);
CREATE INDEX idx_email_templates_status ON public.email_templates(status);

CREATE INDEX idx_email_sends_tenant_id ON public.email_sends(tenant_id);
CREATE INDEX idx_email_sends_campaign_id ON public.email_sends(campaign_id);
CREATE INDEX idx_email_sends_status ON public.email_sends(status);
CREATE INDEX idx_email_sends_sent_at ON public.email_sends(sent_at);

CREATE INDEX idx_email_unsubscribes_tenant_id ON public.email_unsubscribes(tenant_id);
CREATE INDEX idx_email_unsubscribes_recipient_id ON public.email_unsubscribes(recipient_id);

-- Triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sends_updated_at
  BEFORE UPDATE ON public.email_sends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
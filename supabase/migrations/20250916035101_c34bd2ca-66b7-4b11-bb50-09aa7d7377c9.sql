-- Create enums for proposal system
CREATE TYPE proposal_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'sent', 'viewed', 
  'accepted', 'rejected', 'expired', 'cancelled'
);

CREATE TYPE proposal_approval_status AS ENUM (
  'pending', 'approved', 'rejected', 'timeout'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
);

CREATE TYPE payment_method AS ENUM (
  'credit_card', 'debit_card', 'bank_transfer', 'paypal', 'pcbancard'
);

CREATE TYPE signature_type AS ENUM (
  'electronic', 'digital', 'wet_signature', 'api_signature'
);

-- Proposal templates table
CREATE TABLE public.proposal_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  template_content JSONB NOT NULL DEFAULT '{}',
  default_terms TEXT,
  default_validity_days INTEGER DEFAULT 30,
  pricing_structure JSONB DEFAULT '{}',
  required_fields JSONB DEFAULT '[]',
  validation_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Main proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  template_id UUID,
  proposal_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}',
  status proposal_status DEFAULT 'draft',
  total_amount NUMERIC(10,2),
  currency currency_code DEFAULT 'USD',
  tax_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  final_amount NUMERIC(10,2),
  
  -- Validity and timeline
  valid_until DATE,
  created_date DATE DEFAULT CURRENT_DATE,
  sent_date TIMESTAMP WITH TIME ZONE,
  viewed_date TIMESTAMP WITH TIME ZONE,
  accepted_date TIMESTAMP WITH TIME ZONE,
  
  -- Terms and conditions
  terms_and_conditions TEXT,
  payment_terms TEXT,
  delivery_terms TEXT,
  
  -- Tracking and metadata
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  tracking_pixel_id UUID DEFAULT gen_random_uuid(),
  
  -- Error handling
  validation_errors JSONB DEFAULT '[]',
  generation_errors JSONB DEFAULT '[]',
  delivery_errors JSONB DEFAULT '[]',
  
  -- Audit fields
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Proposal line items
CREATE TABLE public.proposal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL,
  item_order INTEGER NOT NULL,
  item_type TEXT DEFAULT 'service',
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_percent NUMERIC(5,2) DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Proposal versions for change tracking
CREATE TABLE public.proposal_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  content_snapshot JSONB NOT NULL,
  changes_summary TEXT,
  change_type TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Proposal approvals workflow
CREATE TABLE public.proposal_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL,
  approver_id UUID NOT NULL,
  approval_level INTEGER DEFAULT 1,
  status proposal_approval_status DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  timeout_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT false,
  notification_errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment transactions
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL,
  client_id UUID NOT NULL,
  
  -- Transaction details
  transaction_id TEXT UNIQUE,
  external_transaction_id TEXT,
  payment_method payment_method NOT NULL,
  payment_processor TEXT DEFAULT 'pcbancard',
  
  -- Amounts
  amount NUMERIC(10,2) NOT NULL,
  currency currency_code DEFAULT 'USD',
  processing_fee NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(10,2),
  
  -- Status and timeline
  status payment_status DEFAULT 'pending',
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Card details (encrypted/tokenized)
  card_last_four TEXT,
  card_brand TEXT,
  card_token TEXT,
  
  -- Error handling
  error_code TEXT,
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- PCI compliance fields
  audit_trail JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Proposal comments and feedback
CREATE TABLE public.proposal_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL,
  user_id UUID,
  client_contact_id UUID,
  parent_comment_id UUID,
  
  content TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general',
  is_internal BOOLEAN DEFAULT false,
  is_moderated BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending',
  moderation_notes TEXT,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Electronic signatures
CREATE TABLE public.proposal_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL,
  signer_id UUID,
  signer_email TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signature_type signature_type NOT NULL,
  
  -- Signature data
  signature_data JSONB,
  signature_image_url TEXT,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  
  -- Verification
  verification_code TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT,
  
  -- Timeline
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  signed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  delivery_attempts INTEGER DEFAULT 0,
  delivery_errors JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Proposal tracking events
CREATE TABLE public.proposal_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL,
  
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Geographic data
  country TEXT,
  city TEXT,
  timezone TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Proposal notifications
CREATE TABLE public.proposal_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  proposal_id UUID NOT NULL,
  
  notification_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  
  -- Delivery status
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  delivery_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage proposal templates in their tenant" 
ON public.proposal_templates FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposals in their tenant" 
ON public.proposals FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposal items in their tenant" 
ON public.proposal_items FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposal versions in their tenant" 
ON public.proposal_versions FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposal approvals in their tenant" 
ON public.proposal_approvals FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage payment transactions in their tenant" 
ON public.payment_transactions FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposal comments in their tenant" 
ON public.proposal_comments FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposal signatures in their tenant" 
ON public.proposal_signatures FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposal tracking in their tenant" 
ON public.proposal_tracking FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposal notifications in their tenant" 
ON public.proposal_notifications FOR ALL 
USING (tenant_id = get_current_user_tenant_id());

-- Create indexes for performance
CREATE INDEX idx_proposals_tenant_client ON public.proposals(tenant_id, client_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_created_at ON public.proposals(created_at);
CREATE INDEX idx_proposal_items_proposal_id ON public.proposal_items(proposal_id);
CREATE INDEX idx_payment_transactions_proposal_id ON public.payment_transactions(proposal_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_proposal_tracking_proposal_id ON public.proposal_tracking(proposal_id);
CREATE INDEX idx_proposal_tracking_created_at ON public.proposal_tracking(created_at);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_proposal_templates_updated_at
    BEFORE UPDATE ON public.proposal_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Sample proposal template
INSERT INTO public.proposal_templates (
  tenant_id,
  name,
  description,
  category,
  template_content,
  default_terms,
  pricing_structure,
  required_fields,
  validation_rules
) VALUES (
  'demo-tenant-id',
  'IT Services Proposal',
  'Standard IT services proposal template',
  'IT Services',
  '{
    "sections": [
      {"id": "overview", "title": "Project Overview", "type": "text"},
      {"id": "scope", "title": "Scope of Work", "type": "list"},
      {"id": "timeline", "title": "Project Timeline", "type": "timeline"},
      {"id": "pricing", "title": "Pricing", "type": "pricing_table"}
    ],
    "branding": {
      "logo_position": "header",
      "color_scheme": "professional",
      "font_family": "Arial"
    }
  }',
  'Payment terms: Net 30 days. Project timeline subject to client approval and feedback.',
  '{
    "currency": "USD",
    "tax_rate": 0.1,
    "discount_types": ["percentage", "fixed"],
    "payment_schedule": ["upfront", "milestone", "completion"]
  }',
  '["client_name", "project_title", "total_amount"]',
  '{
    "min_amount": 100,
    "max_amount": 100000,
    "required_approvals": 1,
    "validity_days": 30
  }'
);

-- Sample proposal
INSERT INTO public.proposals (
  tenant_id,
  client_id,
  template_id,
  proposal_number,
  title,
  description,
  content,
  total_amount,
  tax_amount,
  final_amount,
  valid_until,
  terms_and_conditions,
  payment_terms
) VALUES (
  'demo-tenant-id',
  'demo-client-id-1',
  (SELECT id FROM public.proposal_templates WHERE name = 'IT Services Proposal' LIMIT 1),
  'PROP-2024-001',
  'IT Infrastructure Upgrade',
  'Complete IT infrastructure modernization proposal',
  '{
    "overview": "Comprehensive IT infrastructure upgrade including server migration, network security enhancement, and cloud integration.",
    "scope": [
      "Server hardware assessment and replacement",
      "Network security audit and firewall upgrade",
      "Cloud migration strategy and implementation",
      "Staff training and documentation"
    ],
    "timeline": {
      "phase1": "Assessment and Planning - 2 weeks",
      "phase2": "Hardware Installation - 3 weeks", 
      "phase3": "Migration and Testing - 2 weeks",
      "phase4": "Training and Handover - 1 week"
    }
  }',
  25000.00,
  2500.00,
  27500.00,
  CURRENT_DATE + INTERVAL '30 days',
  'This proposal is valid for 30 days. Payment terms: 50% upfront, 50% on completion.',
  'Net 30 days from invoice date'
);

-- Sample proposal items
INSERT INTO public.proposal_items (
  tenant_id,
  proposal_id,
  item_order,
  name,
  description,
  quantity,
  unit_price,
  tax_percent,
  total_price
) VALUES 
(
  'demo-tenant-id',
  (SELECT id FROM public.proposals WHERE proposal_number = 'PROP-2024-001' LIMIT 1),
  1,
  'Server Hardware',
  'Dell PowerEdge servers with 3-year warranty',
  2,
  8000.00,
  10,
  16000.00
),
(
  'demo-tenant-id',
  (SELECT id FROM public.proposals WHERE proposal_number = 'PROP-2024-001' LIMIT 1),
  2,
  'Network Security Upgrade',
  'Firewall and intrusion detection system',
  1,
  5000.00,
  10,
  5000.00
),
(
  'demo-tenant-id',
  (SELECT id FROM public.proposals WHERE proposal_number = 'PROP-2024-001' LIMIT 1),
  3,
  'Implementation Services',
  'Professional services for installation and configuration',
  40,
  100.00,
  10,
  4000.00
);
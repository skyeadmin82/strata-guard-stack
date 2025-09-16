-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id, category)
);

-- Create company settings table
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  category TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, category)
);

-- Create help articles table
CREATE TABLE public.help_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  not_helpful_votes INTEGER DEFAULT 0,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their notifications"
ON public.notifications
FOR ALL
USING (tenant_id = get_current_user_tenant_id() AND (user_id IS NULL OR user_id IN (
  SELECT id FROM users WHERE auth_user_id = auth.uid()
)));

CREATE POLICY "Users can manage their user settings"
ON public.user_settings
FOR ALL
USING (tenant_id = get_current_user_tenant_id() AND user_id IN (
  SELECT id FROM users WHERE auth_user_id = auth.uid()
));

CREATE POLICY "Users can manage company settings in their tenant"
ON public.company_settings
FOR ALL
USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can view help articles in their tenant"
ON public.help_articles
FOR SELECT
USING (tenant_id = get_current_user_tenant_id() AND is_published = true);

CREATE POLICY "Admins can manage help articles in their tenant"
ON public.help_articles
FOR ALL
USING (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

-- Add triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample help articles
INSERT INTO public.help_articles (tenant_id, slug, title, excerpt, content, category, tags, is_published, is_featured) VALUES
(get_current_user_tenant_id(), 'getting-started', 'Getting Started with MSP Platform', 'Learn the basics of using the MSP platform', 'Welcome to the MSP platform! This guide will help you get started with managing your clients, tickets, and services.

## First Steps

1. **Set up your profile**: Complete your user profile with your name and contact information.
2. **Add your first client**: Navigate to Clients > Add Client to create your first client record.
3. **Create a support ticket**: Use the Tickets section to track customer issues.
4. **Explore reporting**: Check out the Reports section for business insights.

## Navigation

The main navigation is located in the sidebar. Key sections include:
- **Dashboard**: Overview of your business metrics
- **Clients**: Manage customer relationships
- **Tickets**: Track support requests
- **Contracts**: Handle service agreements
- **Reports**: Business intelligence and analytics

## Getting Help

If you need assistance, use the help system by clicking the help icon or visiting this help section.', 'getting-started', ARRAY['basics', 'tutorial', 'setup'], true, true),

(get_current_user_tenant_id(), 'create-ticket', 'How to Create a Support Ticket', 'Step-by-step guide to creating support tickets', 'Creating support tickets is essential for tracking customer issues and ensuring timely resolution.

## Steps to Create a Ticket

1. **Navigate to Tickets**: Click on "Tickets" in the main navigation.
2. **Click "Create Ticket"**: Use the blue "Create Ticket" button.
3. **Fill in Details**:
   - **Title**: Brief description of the issue
   - **Client**: Select the affected client
   - **Priority**: Choose urgency level (Low, Medium, High, Critical)
   - **Category**: Select appropriate category
   - **Description**: Detailed explanation of the issue
4. **Attach Files**: Add screenshots or relevant documents
5. **Assign Technician**: Select who should handle the ticket
6. **Submit**: Click "Create Ticket" to save

## Priority Levels

- **Low**: General questions, minor issues
- **Medium**: Standard support requests
- **High**: Issues affecting productivity
- **Critical**: System down, urgent problems

## Best Practices

- Use clear, descriptive titles
- Include steps to reproduce issues
- Attach relevant screenshots
- Set appropriate priority levels', 'tickets', ARRAY['tickets', 'support', 'workflow'], true, true),

(get_current_user_tenant_id(), 'manage-clients', 'Client Management Guide', 'Complete guide to managing client relationships', 'Effective client management is crucial for MSP success. This guide covers all aspects of client management.

## Adding New Clients

1. Go to **Clients** section
2. Click **Add Client**
3. Fill in required information:
   - Company name
   - Primary contact details
   - Industry and company size
   - Service requirements

## Client Information

### Basic Details
- Company name and website
- Primary and secondary contacts
- Physical address
- Industry classification

### Service Information
- Active contracts
- Service level agreements
- Historical tickets
- Asset inventory

## Managing Contacts

Each client can have multiple contacts:
- Primary contact (main point of contact)
- Technical contacts
- Billing contacts
- Emergency contacts

Add contacts by clicking "Manage Contacts" in the client details.

## Best Practices

- Keep contact information up to date
- Document all interactions
- Set up regular check-ins
- Monitor service satisfaction', 'clients', ARRAY['clients', 'relationships', 'management'], true, false);
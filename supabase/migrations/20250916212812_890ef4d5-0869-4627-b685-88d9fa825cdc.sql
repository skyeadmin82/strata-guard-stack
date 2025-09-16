-- Fix Critical RLS Security Issues
-- Enable RLS on all tables that don't have it and add proper policies

-- Enable RLS on tables missing it
ALTER TABLE public.recurring_invoice_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for all tenant-isolated tables

-- Recurring Invoice Schedules
CREATE POLICY "Tenant access to recurring invoice schedules" ON public.recurring_invoice_schedules
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Proposal Catalog
CREATE POLICY "Tenant access to proposal catalog" ON public.proposal_catalog
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Email Templates
CREATE POLICY "Tenant access to email templates" ON public.email_templates
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Email Campaigns
CREATE POLICY "Tenant access to email campaigns" ON public.email_campaigns
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Email Recipients
CREATE POLICY "Tenant access to email recipients" ON public.email_recipients
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Email Analytics
CREATE POLICY "Tenant access to email analytics" ON public.email_analytics
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- SLA Rules
CREATE POLICY "Tenant access to SLA rules" ON public.sla_rules
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Time Tracking Entries
CREATE POLICY "Tenant access to time tracking entries" ON public.time_tracking_entries
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- User Settings (user can only access their own settings)
CREATE POLICY "Users can access their own settings" ON public.user_settings
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Data Export Requests (user can only access their own requests)
CREATE POLICY "Users can access their own data export requests" ON public.data_export_requests
FOR ALL USING (requested_by IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Error Logs (tenant access, read-only for non-admins)
CREATE POLICY "Tenant access to error logs" ON public.error_logs
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage error logs" ON public.error_logs
FOR INSERT, UPDATE, DELETE USING (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

-- System Metrics (tenant access, read-only for non-admins)
CREATE POLICY "Tenant access to system metrics" ON public.system_metrics
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can manage system metrics" ON public.system_metrics
FOR INSERT, UPDATE, DELETE USING (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

-- Integration Configurations (tenant access)
CREATE POLICY "Tenant access to integration configurations" ON public.integration_configurations
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Workflow Executions (tenant access)
CREATE POLICY "Tenant access to workflow executions" ON public.workflow_executions
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Fix any existing weak policies on critical tables

-- Ensure support_tickets has proper RLS
DROP POLICY IF EXISTS "Users can manage tickets in their tenant" ON public.support_tickets;
CREATE POLICY "Users can manage tickets in their tenant" ON public.support_tickets
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Ensure proposals have proper RLS
DROP POLICY IF EXISTS "Users can manage proposals in their tenant" ON public.proposals;
CREATE POLICY "Users can manage proposals in their tenant" ON public.proposals
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Ensure proposal_items have proper RLS
DROP POLICY IF EXISTS "Users can manage proposal items in their tenant" ON public.proposal_items;
CREATE POLICY "Users can manage proposal items in their tenant" ON public.proposal_items
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Ensure contracts have proper RLS beyond what exists
DROP POLICY IF EXISTS "Users can view contracts in their tenant" ON public.contracts;
CREATE POLICY "Users can manage contracts in their tenant" ON public.contracts
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Add RLS for financial tables
DROP POLICY IF EXISTS "Tenant access to invoices" ON public.invoices;
CREATE POLICY "Tenant access to invoices" ON public.invoices
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Add policies for tenant management (restrict to admins)
CREATE POLICY "Admins can view their tenant" ON public.tenants
FOR SELECT USING (id = get_current_user_tenant_id());

CREATE POLICY "Admins can update their tenant" ON public.tenants
FOR UPDATE USING (id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

-- Secure users table properly
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.users;
CREATE POLICY "Users can view profiles in their tenant" ON public.users
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can manage users in their tenant" ON public.users
FOR INSERT, UPDATE, DELETE USING (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));
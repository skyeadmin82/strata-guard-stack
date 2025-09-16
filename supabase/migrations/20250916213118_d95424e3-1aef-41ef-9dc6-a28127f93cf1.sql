-- Fix Critical RLS Security Issues - Only for Existing Tables
-- Enable RLS on tables that exist and don't have proper policies

-- Enable RLS on existing tables that need it
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
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for tenant-isolated tables

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

-- Error Logs (tenant access)
CREATE POLICY "Tenant can view error logs" ON public.error_logs
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "System can insert error logs" ON public.error_logs
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

-- Workflow Executions (tenant access)
CREATE POLICY "Tenant access to workflow executions" ON public.workflow_executions
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Integration Connections (tenant access)
CREATE POLICY "Tenant access to integration connections" ON public.integration_connections
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Financial Tables
CREATE POLICY "Tenant access to invoices" ON public.invoices
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to payments" ON public.payments
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to financial transactions" ON public.financial_transactions
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Core Business Tables (fix existing policies)
DROP POLICY IF EXISTS "Users can manage tickets in their tenant" ON public.support_tickets;
CREATE POLICY "Users can manage tickets in their tenant" ON public.support_tickets
FOR ALL USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage proposals in their tenant" ON public.proposals;
CREATE POLICY "Users can manage proposals in their tenant" ON public.proposals
FOR ALL USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "Users can manage proposal items in their tenant" ON public.proposal_items;
CREATE POLICY "Users can manage proposal items in their tenant" ON public.proposal_items
FOR ALL USING (tenant_id = get_current_user_tenant_id());

-- Tenant Management (restrict to admins)
CREATE POLICY "Admins can view their tenant" ON public.tenants
FOR SELECT USING (id = get_current_user_tenant_id());

CREATE POLICY "Admins can update their tenant" ON public.tenants
FOR UPDATE USING (id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

-- User Management (secure properly)
CREATE POLICY "Admins can insert users in their tenant" ON public.users
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can delete users in their tenant" ON public.users
FOR DELETE USING (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));
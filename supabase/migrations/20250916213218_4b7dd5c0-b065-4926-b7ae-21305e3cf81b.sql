-- Fix Critical RLS Security Issues - Final Version
-- Create clean policies for all critical tables

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Tenant access to recurring invoice schedules" ON public.recurring_invoice_schedules;
DROP POLICY IF EXISTS "Tenant access to proposal catalog" ON public.proposal_catalog;
DROP POLICY IF EXISTS "Tenant access to email templates" ON public.email_templates;
DROP POLICY IF EXISTS "Tenant access to email campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Tenant access to email recipients" ON public.email_recipients;
DROP POLICY IF EXISTS "Tenant access to email analytics" ON public.email_analytics;
DROP POLICY IF EXISTS "Tenant access to sla rules" ON public.sla_rules;
DROP POLICY IF EXISTS "Tenant access to time tracking entries" ON public.time_tracking_entries;
DROP POLICY IF EXISTS "Users can access their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can access their own data export requests" ON public.data_export_requests;
DROP POLICY IF EXISTS "Tenant can view error logs" ON public.error_logs;
DROP POLICY IF EXISTS "System can insert error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Tenant access to workflow executions" ON public.workflow_executions;
DROP POLICY IF EXISTS "Tenant access to integration connections" ON public.integration_connections;
DROP POLICY IF EXISTS "Users can manage tickets in their tenant" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can manage proposals in their tenant" ON public.proposals;
DROP POLICY IF EXISTS "Users can manage proposal items in their tenant" ON public.proposal_items;
DROP POLICY IF EXISTS "Tenant access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Tenant access to payments" ON public.payments;
DROP POLICY IF EXISTS "Tenant access to financial transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "Admins can view their tenant" ON public.tenants;
DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
DROP POLICY IF EXISTS "Admins can insert users in their tenant" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users in their tenant" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Tenant access to recurring invoice schedules" ON public.recurring_invoice_schedules
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to proposal catalog" ON public.proposal_catalog
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to email templates" ON public.email_templates
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to email campaigns" ON public.email_campaigns
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to email recipients" ON public.email_recipients
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to email analytics" ON public.email_analytics
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to sla rules" ON public.sla_rules
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to time tracking entries" ON public.time_tracking_entries
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can access their own settings" ON public.user_settings
FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can access their own data export requests" ON public.data_export_requests
FOR ALL USING (requested_by IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Tenant can view error logs" ON public.error_logs
FOR SELECT USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "System can insert error logs" ON public.error_logs
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to workflow executions" ON public.workflow_executions
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to integration connections" ON public.integration_connections
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage tickets in their tenant" ON public.support_tickets
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposals in their tenant" ON public.proposals
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Users can manage proposal items in their tenant" ON public.proposal_items
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to invoices" ON public.invoices
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to payments" ON public.payments
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Tenant access to financial transactions" ON public.financial_transactions
FOR ALL USING (tenant_id = get_current_user_tenant_id());

CREATE POLICY "Admins can view their tenant" ON public.tenants
FOR SELECT USING (id = get_current_user_tenant_id());

CREATE POLICY "Admins can update their tenant" ON public.tenants
FOR UPDATE USING (id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

CREATE POLICY "Admins can insert users in their tenant" ON public.users
FOR INSERT WITH CHECK (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));

CREATE POLICY "Admins can delete users in their tenant" ON public.users
FOR DELETE USING (tenant_id = get_current_user_tenant_id() AND user_has_role('admin'::user_role));
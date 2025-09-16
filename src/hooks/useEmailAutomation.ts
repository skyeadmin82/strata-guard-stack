import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  subject_template: string;
  html_template?: string;
  text_template?: string;
  template_variables: Record<string, any>;
  validation_rules: Record<string, any>;
  status: 'draft' | 'active' | 'archived';
  category?: string;
  sender_name?: string;
  sender_email?: string;
  reply_to?: string;
  is_system_template: boolean;
  validation_errors: any[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  tenant_id: string;
  template_id?: string;
  name: string;
  description?: string;
  campaign_type: 'standard' | 'ab_test' | 'drip' | 'trigger';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed' | 'cancelled';
  send_immediately: boolean;
  scheduled_at?: string;
  timezone: string;
  send_optimization: Record<string, any>;
  ab_test_config: Record<string, any>;
  ab_test_winner?: string;
  recipient_criteria: Record<string, any>;
  recipient_count: number;
  sender_config: Record<string, any>;
  delivery_settings: Record<string, any>;
  rate_limit_per_hour: number;
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_opened: number;
  total_clicked: number;
  total_unsubscribed: number;
  send_errors: any[];
  retry_count: number;
  max_retries: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface EmailRecipient {
  id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  merge_fields: Record<string, any>;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  source?: string;
  tags?: string[];
  preferences: Record<string, any>;
  email_verified: boolean;
  email_validation_status?: string;
  validation_errors: any[];
  total_sends: number;
  total_opens: number;
  total_clicks: number;
  last_opened_at?: string;
  last_clicked_at?: string;
  created_at: string;
  updated_at: string;
}

export const useEmailAutomation = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Template Management
  const createTemplate = useCallback(async (templateData: Partial<EmailTemplate>) => {
    if (!tenantId) throw new Error('Tenant not loaded');

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          tenant_id: tenantId,
          name: templateData.name || 'Untitled Template',
          description: templateData.description,
          subject_template: templateData.subject_template || '',
          html_template: templateData.html_template,
          text_template: templateData.text_template,
          template_variables: templateData.template_variables || {},
          validation_rules: templateData.validation_rules || {},
          status: templateData.status || 'draft',
          category: templateData.category,
          sender_name: templateData.sender_name,
          sender_email: templateData.sender_email,
          reply_to: templateData.reply_to,
          is_system_template: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Template Created",
        description: `Template "${data.name}" has been created successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, toast]);

  const updateTemplate = useCallback(async (templateId: string, updates: Partial<EmailTemplate>) => {
    if (!tenantId) throw new Error('Tenant not loaded');

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('email_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Template Updated",
        description: "Template has been updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update template",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, toast]);

  const getTemplates = useCallback(async () => {
    if (!tenantId) return [];

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }, [tenantId]);

  // Campaign Management
  const createCampaign = useCallback(async (campaignData: Partial<EmailCampaign>) => {
    if (!tenantId) throw new Error('Tenant not loaded');

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          tenant_id: tenantId,
          template_id: campaignData.template_id,
          name: campaignData.name || 'Untitled Campaign',
          description: campaignData.description,
          campaign_type: campaignData.campaign_type || 'standard',
          status: campaignData.status || 'draft',
          send_immediately: campaignData.send_immediately || false,
          scheduled_at: campaignData.scheduled_at,
          timezone: campaignData.timezone || 'UTC',
          send_optimization: campaignData.send_optimization || {},
          ab_test_config: campaignData.ab_test_config || {},
          recipient_criteria: campaignData.recipient_criteria || {},
          sender_config: campaignData.sender_config || {},
          delivery_settings: campaignData.delivery_settings || {},
          rate_limit_per_hour: campaignData.rate_limit_per_hour || 1000,
          max_retries: campaignData.max_retries || 3
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Campaign Created",
        description: `Campaign "${data.name}" has been created successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, toast]);

  const getCampaigns = useCallback(async () => {
    if (!tenantId) return [];

    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          email_templates (
            name,
            subject_template
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }, [tenantId]);

  // Recipient Management
  const addRecipient = useCallback(async (recipientData: Partial<EmailRecipient>) => {
    if (!tenantId) throw new Error('Tenant not loaded');

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('email_recipients')
        .insert({
          tenant_id: tenantId,
          email: recipientData.email || '',
          first_name: recipientData.first_name,
          last_name: recipientData.last_name,
          merge_fields: recipientData.merge_fields || {},
          status: recipientData.status || 'active',
          source: recipientData.source,
          tags: recipientData.tags || [],
          preferences: recipientData.preferences || {},
          email_verified: recipientData.email_verified || false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Recipient Added",
        description: `Recipient "${data.email}" has been added successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error adding recipient:', error);
      toast({
        title: "Addition Failed",
        description: error instanceof Error ? error.message : "Failed to add recipient",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, toast]);

  const getRecipients = useCallback(async (filters: {
    status?: string;
    tags?: string[];
    search?: string;
  } = {}) => {
    if (!tenantId) return [];

    try {
      let query = supabase
        .from('email_recipients')
        .select('*')
        .eq('tenant_id', tenantId);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recipients:', error);
      return [];
    }
  }, [tenantId]);

  // Email Sending
  const sendEmail = useCallback(async (emailData: {
    to: string[];
    subject: string;
    html_content: string;
    text_content?: string;
    from_name?: string;
    from_email?: string;
    reply_to?: string;
    attachments?: Array<{
      filename: string;
      content: string;
      content_type: string;
    }>;
    template_variables?: Record<string, any>;
    campaign_id?: string;
    template_id?: string;
  }) => {
    try {
      setIsSending(true);

      const { data, error } = await supabase.functions.invoke('smtp2go-send', {
        body: emailData
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Email sent successfully to ${emailData.to.length} recipient(s)`,
      });

      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSending(false);
    }
  }, [toast]);

  const testEmail = useCallback(async (templateId: string, testEmail: string, variables: Record<string, any> = {}) => {
    if (!tenantId) throw new Error('Tenant not loaded');

    try {
      // Get template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('tenant_id', tenantId)
        .single();

      if (templateError) throw templateError;

      // Replace variables in templates
      let subject = template.subject_template;
      let htmlContent = template.html_template || '';
      let textContent = template.text_template || '';

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value));
        textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value));
      });

      return await sendEmail({
        to: [testEmail],
        subject: `[TEST] ${subject}`,
        html_content: htmlContent,
        text_content: textContent,
        from_name: template.sender_name,
        from_email: template.sender_email,
        reply_to: template.reply_to,
        template_id: templateId,
        template_variables: variables
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }, [tenantId, sendEmail]);

  // Analytics
  const getCampaignAnalytics = useCallback(async (campaignId: string) => {
    if (!tenantId) return null;

    try {
      const { data, error } = await supabase
        .from('email_analytics')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('campaign_id', campaignId);

      if (error) throw error;

      // Aggregate analytics data
      const analytics = {
        total_events: data.length,
        sent: data.filter(d => d.event_type === 'sent').length,
        delivered: data.filter(d => d.event_type === 'delivered').length,
        opened: data.filter(d => d.event_type === 'opened').length,
        clicked: data.filter(d => d.event_type === 'clicked').length,
        bounced: data.filter(d => d.event_type === 'bounced').length,
        unsubscribed: data.filter(d => d.event_type === 'unsubscribed').length,
        events_by_day: {} as Record<string, number>,
        device_breakdown: {} as Record<string, number>,
        browser_breakdown: {} as Record<string, number>
      };

      // Group events by day
      data.forEach(event => {
        const day = event.event_timestamp?.substring(0, 10) || '';
        analytics.events_by_day[day] = (analytics.events_by_day[day] || 0) + 1;

        if (event.device_type) {
          analytics.device_breakdown[event.device_type] = (analytics.device_breakdown[event.device_type] || 0) + 1;
        }

        if (event.browser) {
          analytics.browser_breakdown[event.browser] = (analytics.browser_breakdown[event.browser] || 0) + 1;
        }
      });

      return analytics;
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return null;
    }
  }, [tenantId]);

  return {
    // State
    isLoading,
    isSending,

    // Template Management
    createTemplate,
    updateTemplate,
    getTemplates,

    // Campaign Management
    createCampaign,
    getCampaigns,

    // Recipient Management
    addRecipient,
    getRecipients,

    // Email Sending
    sendEmail,
    testEmail,

    // Analytics
    getCampaignAnalytics
  };
};
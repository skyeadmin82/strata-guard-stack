import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface EmailRequest {
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
}

interface SMTP2GORequest {
  api_key: string;
  to: string[];
  sender: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  attachments?: Array<{
    filename: string;
    fileblob: string;
    mimetype: string;
  }>;
  custom_headers?: Array<{
    header: string;
    value: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('SMTP2GO Send function started');

    const emailRequest: EmailRequest = await req.json();
    console.log('Email request received:', { 
      recipients: emailRequest.to?.length,
      subject: emailRequest.subject,
      hasCampaign: !!emailRequest.campaign_id 
    });

    // Validate required fields
    if (!emailRequest.to || emailRequest.to.length === 0) {
      throw new Error('Recipients are required');
    }
    if (!emailRequest.subject) {
      throw new Error('Subject is required');
    }
    if (!emailRequest.html_content && !emailRequest.text_content) {
      throw new Error('Either HTML or text content is required');
    }

    // Get user's authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Get user's tenant and email configuration
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    const { data: emailConfig, error: configError } = await supabase
      .from('email_configuration')
      .select('*')
      .eq('tenant_id', userProfile.tenant_id)
      .single();

    if (configError || !emailConfig) {
      throw new Error('Email configuration not found');
    }

    // Validate rate limits
    const { data: recentSends } = await supabase
      .from('email_sends')
      .select('id')
      .eq('tenant_id', userProfile.tenant_id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (recentSends && recentSends.length >= emailConfig.hourly_send_limit) {
      throw new Error('Hourly send limit exceeded');
    }

    // Prepare SMTP2GO request
    const fromEmail = emailRequest.from_email || emailConfig.default_from_email;
    const fromName = emailRequest.from_name || emailConfig.default_from_name;
    const senderString = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    const smtp2goRequest: SMTP2GORequest = {
      api_key: smtp2goApiKey,
      to: emailRequest.to,
      sender: senderString,
      subject: emailRequest.subject,
      html_body: emailRequest.html_content,
      text_body: emailRequest.text_content,
    };

    // Add reply-to header if specified
    if (emailRequest.reply_to || emailConfig.default_reply_to) {
      smtp2goRequest.custom_headers = [
        {
          header: 'Reply-To',
          value: emailRequest.reply_to || emailConfig.default_reply_to
        }
      ];
    }

    // Convert attachments if provided
    if (emailRequest.attachments && emailRequest.attachments.length > 0) {
      smtp2goRequest.attachments = emailRequest.attachments.map(att => ({
        filename: att.filename,
        fileblob: att.content,
        mimetype: att.content_type
      }));
    }

    console.log('Sending email via SMTP2GO:', {
      to: smtp2goRequest.to.length,
      subject: smtp2goRequest.subject
    });

    // Send email via SMTP2GO API
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify(smtp2goRequest),
    });

    const responseData = await response.json();
    
    console.log('SMTP2GO response:', {
      status: response.status,
      success: responseData.request_id ? 'Yes' : 'No',
      request_id: responseData.request_id
    });

    if (!response.ok) {
      console.error('SMTP2GO API error:', responseData);
      throw new Error(`SMTP2GO API error: ${responseData.error || 'Unknown error'}`);
    }

    // Log successful send to database
    const sendRecord = {
      tenant_id: userProfile.tenant_id,
      campaign_id: emailRequest.campaign_id || null,
      template_id: emailRequest.template_id || null,
      subject: emailRequest.subject,
      from_email: fromEmail,
      from_name: fromName,
      reply_to: emailRequest.reply_to || emailConfig.default_reply_to,
      message_id: responseData.request_id,
      smtp_message_id: responseData.request_id,
      status: 'sent',
      send_attempts: 1,
      sent_at: new Date().toISOString(),
    };

    // Create individual send records for each recipient
    for (const recipient of emailRequest.to) {
      // First, create or get recipient record
      const { data: recipientData, error: recipientError } = await supabase
        .from('email_recipients')
        .select('id')
        .eq('tenant_id', userProfile.tenant_id)
        .eq('email', recipient)
        .maybeSingle();

      let recipientId = recipientData?.id;

      if (!recipientId) {
        // Create new recipient
        const { data: newRecipient, error: createError } = await supabase
          .from('email_recipients')
          .insert({
            tenant_id: userProfile.tenant_id,
            email: recipient,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating recipient:', createError);
          continue;
        }
        recipientId = newRecipient.id;
      }

      // Create send record
      const { error: sendError } = await supabase
        .from('email_sends')
        .insert({
          ...sendRecord,
          recipient_id: recipientId,
        });

      if (sendError) {
        console.error('Error creating send record:', sendError);
      }

      // Update recipient stats
      await supabase
        .from('email_recipients')
        .update({
          total_sends: supabase.sql`total_sends + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId);
    }

    // Update campaign stats if campaign is specified
    if (emailRequest.campaign_id) {
      await supabase
        .from('email_campaigns')
        .update({
          total_sent: supabase.sql`total_sent + ${emailRequest.to.length}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailRequest.campaign_id);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: responseData.request_id,
      recipients_count: emailRequest.to.length,
      smtp2go_response: responseData
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in SMTP2GO send function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      details: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
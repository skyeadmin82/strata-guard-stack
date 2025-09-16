import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  proposalId: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');

    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { proposalId, recipientEmail, recipientName, subject, customMessage }: EmailRequest = await req.json();

    if (!proposalId || !recipientEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch proposal details
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        clients!inner(name, email)
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error('Proposal not found');
    }

    // Generate proposal view URL with tracking
    const proposalViewUrl = `${supabaseUrl.replace('https://', 'https://app.')}/proposals/view/${proposalId}?token=${proposal.tracking_pixel_id}`;

    // Prepare email content
    const emailSubject = subject || `Proposal: ${proposal.title}`;
    const senderName = 'MSP Platform';
    const clientName = recipientName || proposal.clients.name || 'Valued Client';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .proposal-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Proposal Available</h1>
        </div>
        
        <div class="content">
          <p>Dear ${clientName},</p>
          
          <p>We're pleased to share our proposal for your upcoming project. We've carefully crafted this proposal to address your specific needs and requirements.</p>
          
          ${customMessage ? `<p>${customMessage}</p>` : ''}
          
          <div class="proposal-details">
            <h3>Proposal Details</h3>
            <p><strong>Title:</strong> ${proposal.title}</p>
            <p><strong>Proposal Number:</strong> ${proposal.proposal_number}</p>
            ${proposal.total_amount ? `<p><strong>Total Value:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: proposal.currency || 'USD' }).format(proposal.final_amount || proposal.total_amount)}</p>` : ''}
            ${proposal.valid_until ? `<p><strong>Valid Until:</strong> ${new Date(proposal.valid_until).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${proposalViewUrl}" class="cta-button">View Proposal</a>
          </div>
          
          <p>You can review the complete proposal, including detailed terms and conditions, by clicking the button above. If you have any questions or would like to discuss any aspect of this proposal, please don't hesitate to reach out.</p>
          
          <p>We look forward to the opportunity to work with you.</p>
          
          <p>Best regards,<br>The ${senderName} Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent regarding proposal ${proposal.proposal_number}</p>
          <p>If you received this email in error, please contact us immediately.</p>
        </div>
      </body>
      </html>
    `;

    // Send email via SMTP2GO
    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        to: [recipientEmail],
        from: `${senderName} <noreply@msp-platform.com>`,
        subject: emailSubject,
        html_body: htmlContent,
        text_body: `
Dear ${clientName},

We're pleased to share our proposal: ${proposal.title}

Proposal Number: ${proposal.proposal_number}
${proposal.total_amount ? `Total Value: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: proposal.currency || 'USD' }).format(proposal.final_amount || proposal.total_amount)}` : ''}
${proposal.valid_until ? `Valid Until: ${new Date(proposal.valid_until).toLocaleDateString()}` : ''}

View the complete proposal: ${proposalViewUrl}

${customMessage || ''}

If you have any questions, please don't hesitate to reach out.

Best regards,
The ${senderName} Team
        `.trim(),
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('SMTP2GO Error:', emailResult);
      throw new Error(`Email sending failed: ${emailResult.errors?.[0]?.message || 'Unknown error'}`);
    }

    // Update proposal status and tracking
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        status: 'sent',
        sent_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', proposalId);

    if (updateError) {
      console.warn('Failed to update proposal status:', updateError);
    }

    // Log the email sending activity
    const { error: logError } = await supabase
      .from('proposal_notifications')
      .insert({
        tenant_id: proposal.tenant_id,
        proposal_id: proposalId,
        notification_type: 'email_sent',
        recipient_email: recipientEmail,
        recipient_name: clientName,
        subject: emailSubject,
        delivery_status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: {
          smtp_message_id: emailResult.data?.email_id,
          tracking_url: proposalViewUrl,
        },
      });

    if (logError) {
      console.warn('Failed to log email notification:', logError);
    }

    console.log('Proposal email sent successfully:', emailResult);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResult.data?.email_id,
      trackingUrl: proposalViewUrl 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-proposal-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface BounceEvent {
  bounce_type: 'hard' | 'soft' | 'complaint' | 'suppression';
  bounce_subtype?: string;
  bounce_code?: string;
  bounce_reason?: string;
  smtp_response?: string;
  recipient_email: string;
  message_id?: string;
  timestamp: string;
}

const categorizeBounce = (bounceReason: string, smtpResponse: string): {
  type: 'hard' | 'soft' | 'complaint' | 'suppression';
  subtype: string;
  isPermanent: boolean;
  severityLevel: number;
  shouldRetry: boolean;
} => {
  const lowerReason = (bounceReason || '').toLowerCase();
  const lowerResponse = (smtpResponse || '').toLowerCase();
  
  // Hard bounces (permanent failures)
  if (
    lowerReason.includes('mailbox does not exist') ||
    lowerReason.includes('user unknown') ||
    lowerReason.includes('no such user') ||
    lowerResponse.includes('550') ||
    lowerResponse.includes('551') ||
    lowerResponse.includes('553')
  ) {
    return {
      type: 'hard',
      subtype: 'invalid_mailbox',
      isPermanent: true,
      severityLevel: 5,
      shouldRetry: false
    };
  }

  // Soft bounces (temporary failures)
  if (
    lowerReason.includes('mailbox full') ||
    lowerReason.includes('quota exceeded') ||
    lowerReason.includes('temporarily unavailable') ||
    lowerResponse.includes('452') ||
    lowerResponse.includes('421')
  ) {
    return {
      type: 'soft',
      subtype: 'mailbox_full',
      isPermanent: false,
      severityLevel: 2,
      shouldRetry: true
    };
  }

  // Spam complaints
  if (
    lowerReason.includes('spam') ||
    lowerReason.includes('complaint') ||
    lowerReason.includes('abuse') ||
    lowerResponse.includes('554')
  ) {
    return {
      type: 'complaint',
      subtype: 'spam_complaint',
      isPermanent: true,
      severityLevel: 4,
      shouldRetry: false
    };
  }

  // Default to soft bounce with retry
  return {
    type: 'soft',
    subtype: 'unknown',
    isPermanent: false,
    severityLevel: 2,
    shouldRetry: true
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Bounce handler function started');

    const bounceEvent: BounceEvent = await req.json();
    console.log('Bounce event received:', {
      type: bounceEvent.bounce_type,
      recipient: bounceEvent.recipient_email,
      reason: bounceEvent.bounce_reason?.substring(0, 100)
    });

    // Categorize the bounce
    const bounceAnalysis = categorizeBounce(
      bounceEvent.bounce_reason || '',
      bounceEvent.smtp_response || ''
    );

    // Find the recipient
    const { data: recipient, error: recipientError } = await supabase
      .from('email_recipients')
      .select('id, tenant_id, status, total_sends')
      .eq('email', bounceEvent.recipient_email)
      .maybeSingle();

    if (recipientError) {
      console.error('Error finding recipient:', recipientError);
      throw new Error('Error finding recipient');
    }

    if (!recipient) {
      console.warn('Recipient not found for bounce:', bounceEvent.recipient_email);
      return new Response(JSON.stringify({
        success: true,
        message: 'Recipient not found, bounce ignored'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Find the send record if message_id is provided
    let sendRecord = null;
    if (bounceEvent.message_id) {
      const { data } = await supabase
        .from('email_sends')
        .select('id, campaign_id, template_id')
        .eq('recipient_id', recipient.id)
        .eq('smtp_message_id', bounceEvent.message_id)
        .maybeSingle();
      
      sendRecord = data;
    }

    // Create bounce record
    const { data: bounceRecord, error: bounceError } = await supabase
      .from('email_bounces')
      .insert({
        tenant_id: recipient.tenant_id,
        send_id: sendRecord?.id || null,
        recipient_id: recipient.id,
        bounce_type: bounceAnalysis.type,
        bounce_subtype: bounceAnalysis.subtype,
        bounce_code: bounceEvent.bounce_code,
        bounce_reason: bounceEvent.bounce_reason,
        smtp_response: bounceEvent.smtp_response,
        is_permanent: bounceAnalysis.isPermanent,
        severity_level: bounceAnalysis.severityLevel,
        should_retry: bounceAnalysis.shouldRetry,
        bounce_timestamp: bounceEvent.timestamp
      })
      .select()
      .single();

    if (bounceError) {
      console.error('Error creating bounce record:', bounceError);
      throw new Error('Error creating bounce record');
    }

    // Update send record if found
    if (sendRecord) {
      await supabase
        .from('email_sends')
        .update({
          status: 'bounced',
          bounce_type: bounceAnalysis.type,
          bounce_reason: bounceEvent.bounce_reason,
          bounced_at: bounceEvent.timestamp,
          updated_at: new Date().toISOString()
        })
        .eq('id', sendRecord.id);

      // Update campaign stats if applicable
      if (sendRecord.campaign_id) {
        await supabase
          .from('email_campaigns')
          .update({
            total_bounced: supabase.sql`total_bounced + 1`,
            updated_at: new Date().toISOString()
          })
          .eq('id', sendRecord.campaign_id);
      }
    }

    // Update recipient status based on bounce severity
    let newRecipientStatus = recipient.status;
    
    if (bounceAnalysis.isPermanent || bounceAnalysis.severityLevel >= 4) {
      newRecipientStatus = 'bounced';
    }

    await supabase
      .from('email_recipients')
      .update({
        status: newRecipientStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipient.id);

    // Log analytics event
    await supabase
      .from('email_analytics')
      .insert({
        tenant_id: recipient.tenant_id,
        send_id: sendRecord?.id || null,
        campaign_id: sendRecord?.campaign_id || null,
        recipient_id: recipient.id,
        event_type: 'bounced',
        event_data: {
          bounce_type: bounceAnalysis.type,
          bounce_subtype: bounceAnalysis.subtype,
          bounce_reason: bounceEvent.bounce_reason,
          severity_level: bounceAnalysis.severityLevel,
          is_permanent: bounceAnalysis.isPermanent
        },
        event_timestamp: bounceEvent.timestamp
      });

    console.log('Bounce processed successfully:', {
      bounce_id: bounceRecord.id,
      type: bounceAnalysis.type,
      permanent: bounceAnalysis.isPermanent
    });

    return new Response(JSON.stringify({
      success: true,
      bounce_id: bounceRecord.id,
      bounce_analysis: bounceAnalysis,
      recipient_status: newRecipientStatus
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in bounce handler:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
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
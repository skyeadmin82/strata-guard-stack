import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

// 1x1 transparent tracking pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
  0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
  0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x04,
  0x01, 0x00, 0x3B
]);

const parseUserAgent = (userAgent: string) => {
  const ua = userAgent.toLowerCase();
  
  let device_type = 'desktop';
  let browser = 'unknown';
  let operating_system = 'unknown';

  // Device detection
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device_type = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device_type = 'tablet';
  }

  // Browser detection
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  // OS detection
  if (ua.includes('windows')) operating_system = 'Windows';
  else if (ua.includes('mac')) operating_system = 'macOS';
  else if (ua.includes('linux')) operating_system = 'Linux';
  else if (ua.includes('android')) operating_system = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) operating_system = 'iOS';

  return { device_type, browser, operating_system };
};

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    // Handle open tracking (pixel request)
    if (pathname === '/track/open') {
      const sendId = url.searchParams.get('send_id');
      const recipientId = url.searchParams.get('recipient_id');

      if (!sendId || !recipientId) {
        console.warn('Missing tracking parameters');
        return new Response(TRACKING_PIXEL, {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...corsHeaders
          },
        });
      }

      // Get send and recipient info
      const { data: sendData, error: sendError } = await supabase
        .from('email_sends')
        .select('id, tenant_id, campaign_id, template_id, open_count')
        .eq('id', sendId)
        .single();

      if (sendError || !sendData) {
        console.error('Send record not found:', sendId);
        return new Response(TRACKING_PIXEL, {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache',
            ...corsHeaders
          },
        });
      }

      // Parse user agent and get client IP
      const userAgent = req.headers.get('User-Agent') || '';
      const userAgentInfo = parseUserAgent(userAgent);
      const clientIP = req.headers.get('CF-Connecting-IP') || 
                      req.headers.get('X-Forwarded-For') || 
                      req.headers.get('X-Real-IP');

      // Track the open event
      const isFirstOpen = sendData.open_count === 0;

      // Update send record
      await supabase
        .from('email_sends')
        .update({
          open_count: supabase.sql`open_count + 1`,
          opened_at: isFirstOpen ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', sendId);

      // Update recipient stats
      await supabase
        .from('email_recipients')
        .update({
          total_opens: supabase.sql`total_opens + 1`,
          last_opened_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      // Update campaign stats if applicable
      if (sendData.campaign_id && isFirstOpen) {
        await supabase
          .from('email_campaigns')
          .update({
            total_opened: supabase.sql`total_opened + 1`,
            updated_at: new Date().toISOString()
          })
          .eq('id', sendData.campaign_id);
      }

      // Log analytics event
      await supabase
        .from('email_analytics')
        .insert({
          tenant_id: sendData.tenant_id,
          send_id: sendId,
          campaign_id: sendData.campaign_id,
          recipient_id: recipientId,
          event_type: 'opened',
          event_data: {
            is_first_open: isFirstOpen,
            open_count: sendData.open_count + 1
          },
          ip_address: clientIP,
          user_agent: userAgent,
          device_type: userAgentInfo.device_type,
          browser: userAgentInfo.browser,
          operating_system: userAgentInfo.operating_system,
          event_timestamp: new Date().toISOString()
        });

      console.log('Open tracked successfully:', {
        send_id: sendId,
        recipient_id: recipientId,
        is_first_open: isFirstOpen
      });

      return new Response(TRACKING_PIXEL, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...corsHeaders
        },
      });
    }

    // Handle click tracking (redirect)
    if (pathname === '/track/click') {
      const sendId = url.searchParams.get('send_id');
      const recipientId = url.searchParams.get('recipient_id');
      const targetUrl = url.searchParams.get('url');

      if (!sendId || !recipientId || !targetUrl) {
        return new Response('Missing parameters', {
          status: 400,
          headers: corsHeaders
        });
      }

      // Get send info
      const { data: sendData, error: sendError } = await supabase
        .from('email_sends')
        .select('id, tenant_id, campaign_id, template_id, click_count')
        .eq('id', sendId)
        .single();

      if (sendError || !sendData) {
        // Redirect even if tracking fails
        return Response.redirect(decodeURIComponent(targetUrl), 302);
      }

      // Parse user agent and get client IP
      const userAgent = req.headers.get('User-Agent') || '';
      const userAgentInfo = parseUserAgent(userAgent);
      const clientIP = req.headers.get('CF-Connecting-IP') || 
                      req.headers.get('X-Forwarded-For') || 
                      req.headers.get('X-Real-IP');

      const isFirstClick = sendData.click_count === 0;

      // Update send record
      await supabase
        .from('email_sends')
        .update({
          click_count: supabase.sql`click_count + 1`,
          first_clicked_at: isFirstClick ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', sendId);

      // Update recipient stats
      await supabase
        .from('email_recipients')
        .update({
          total_clicks: supabase.sql`total_clicks + 1`,
          last_clicked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      // Update campaign stats if applicable
      if (sendData.campaign_id && isFirstClick) {
        await supabase
          .from('email_campaigns')
          .update({
            total_clicked: supabase.sql`total_clicked + 1`,
            updated_at: new Date().toISOString()
          })
          .eq('id', sendData.campaign_id);
      }

      // Log analytics event
      await supabase
        .from('email_analytics')
        .insert({
          tenant_id: sendData.tenant_id,
          send_id: sendId,
          campaign_id: sendData.campaign_id,
          recipient_id: recipientId,
          event_type: 'clicked',
          event_data: {
            is_first_click: isFirstClick,
            click_count: sendData.click_count + 1
          },
          url: decodeURIComponent(targetUrl),
          ip_address: clientIP,
          user_agent: userAgent,
          device_type: userAgentInfo.device_type,
          browser: userAgentInfo.browser,
          operating_system: userAgentInfo.operating_system,
          event_timestamp: new Date().toISOString()
        });

      console.log('Click tracked successfully:', {
        send_id: sendId,
        recipient_id: recipientId,
        target_url: targetUrl,
        is_first_click: isFirstClick
      });

      // Redirect to the target URL
      return Response.redirect(decodeURIComponent(targetUrl), 302);
    }

    // Handle unsubscribe tracking
    if (pathname === '/track/unsubscribe') {
      const recipientId = url.searchParams.get('recipient_id');
      const campaignId = url.searchParams.get('campaign_id');

      if (!recipientId) {
        return new Response('Missing recipient ID', {
          status: 400,
          headers: corsHeaders
        });
      }

      // Get recipient info
      const { data: recipient, error: recipientError } = await supabase
        .from('email_recipients')
        .select('id, tenant_id, email, status')
        .eq('id', recipientId)
        .single();

      if (recipientError || !recipient) {
        return new Response('Recipient not found', {
          status: 404,
          headers: corsHeaders
        });
      }

      if (recipient.status === 'unsubscribed') {
        return new Response('Already unsubscribed', {
          status: 200,
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      }

      // Parse user agent and get client IP
      const userAgent = req.headers.get('User-Agent') || '';
      const clientIP = req.headers.get('CF-Connecting-IP') || 
                      req.headers.get('X-Forwarded-For') || 
                      req.headers.get('X-Real-IP');

      // Create unsubscribe record
      const { data: unsubscribeRecord, error: unsubError } = await supabase
        .from('email_unsubscribes')
        .insert({
          tenant_id: recipient.tenant_id,
          recipient_id: recipientId,
          campaign_id: campaignId,
          unsubscribe_type: 'manual',
          unsubscribe_method: 'link',
          ip_address: clientIP,
          user_agent: userAgent,
          compliance_method: 'one_click',
          confirmation_sent: false
        })
        .select()
        .single();

      if (unsubError) {
        console.error('Error creating unsubscribe record:', unsubError);
      }

      // Update recipient status
      await supabase
        .from('email_recipients')
        .update({
          status: 'unsubscribed',
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      // Update campaign stats if applicable
      if (campaignId) {
        await supabase
          .from('email_campaigns')
          .update({
            total_unsubscribed: supabase.sql`total_unsubscribed + 1`,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);
      }

      // Log analytics event
      await supabase
        .from('email_analytics')
        .insert({
          tenant_id: recipient.tenant_id,
          campaign_id: campaignId,
          recipient_id: recipientId,
          event_type: 'unsubscribed',
          event_data: {
            method: 'link',
            type: 'manual'
          },
          ip_address: clientIP,
          user_agent: userAgent,
          event_timestamp: new Date().toISOString()
        });

      console.log('Unsubscribe tracked successfully:', {
        recipient_id: recipientId,
        email: recipient.email
      });

      return new Response('Successfully unsubscribed', {
        status: 200,
        headers: { 'Content-Type': 'text/plain', ...corsHeaders }
      });
    }

    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('Error in tracking handler:', error);
    
    // For pixel requests, always return pixel even on error
    if (url.pathname === '/track/open') {
      return new Response(TRACKING_PIXEL, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          ...corsHeaders
        },
      });
    }
    
    return new Response(JSON.stringify({
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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { createHmac } from "node:crypto";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function verifyWebhookSignature(payload: string, signature: string, secret: string, algorithm = 'sha256'): boolean {
  try {
    const hmac = createHmac(algorithm, secret);
    const digest = hmac.update(payload).digest('hex');
    const expectedSignature = `${algorithm}=${digest}`;
    
    // Use timing-safe comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function logWebhookDelivery(
  webhookId: string, 
  eventType: string, 
  eventData: any, 
  status: string, 
  responseCode?: number,
  errorMessage?: string
) {
  try {
    await subabase.from('webhook_delivery_logs').insert({
      webhook_id: webhookId,
      event_type: eventType,
      event_data: eventData,
      status,
      response_code: responseCode,
      error_message: errorMessage,
      attempted_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log webhook delivery:', error);
  }
}

async function processQuickBooksWebhook(webhook: any, payload: any) {
  console.log('Processing QuickBooks webhook:', payload);
  
  try {
    const eventNotifications = payload.eventNotifications || [];
    
    for (const notification of eventNotifications) {
      const { realmId, dataChangeEvent } = notification;
      
      // Find the connection for this company
      const { data: connection } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('tenant_id', webhook.tenant_id)
        .filter('credentials->company_id', 'eq', realmId)
        .single();
      
      if (!connection) {
        console.warn(`No connection found for QuickBooks company ${realmId}`);
        continue;
      }
      
      // Process each entity change
      const entities = dataChangeEvent?.entities || [];
      
      for (const entity of entities) {
        const { name: entityType, id: entityId, operation } = entity;
        
        console.log(`Processing ${operation} for ${entityType} ${entityId}`);
        
        // Create sync job for this entity
        await supabase.from('integration_sync_jobs').insert({
          tenant_id: connection.tenant_id,
          connection_id: connection.id,
          job_type: 'webhook_sync',
          sync_direction: 'inbound',
          priority: 8, // High priority for webhook-triggered syncs
          status: 'queued',
          sync_results: {
            entity_type: entityType,
            entity_id: entityId,
            operation,
            source: 'quickbooks_webhook'
          },
          created_at: new Date().toISOString(),
        });
        
        // If it's a customer change, trigger immediate sync
        if (entityType === 'Customer') {
          try {
            // Call sync function
            const syncResponse = await fetch(`${supabaseUrl}/functions/v1/quickbooks-integration/sync`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                connectionId: connection.id,
                syncType: 'customers'
              }),
            });
            
            if (!syncResponse.ok) {
              throw new Error(`Sync failed: ${syncResponse.status}`);
            }
            
            console.log('Customer sync triggered successfully');
          } catch (error) {
            console.error('Failed to trigger customer sync:', error);
          }
        }
      }
    }
    
    await logWebhookDelivery(webhook.id, 'quickbooks_notification', payload, 'delivered', 200);
    
  } catch (error) {
    console.error('QuickBooks webhook processing error:', error);
    await logWebhookDelivery(webhook.id, 'quickbooks_notification', payload, 'failed', 500, error.message);
    throw error;
  }
}

async function processGenericWebhook(webhook: any, payload: any) {
  console.log('Processing generic webhook:', payload);
  
  try {
    // Extract event type from payload
    const eventType = payload.event_type || payload.type || 'unknown';
    
    // Log the webhook delivery
    await logWebhookDelivery(webhook.id, eventType, payload, 'delivered', 200);
    
    // Create a sync job if configured
    if (webhook.sync_settings?.create_sync_job) {
      await supabase.from('integration_sync_jobs').insert({
        tenant_id: webhook.tenant_id,
        connection_id: webhook.connection_id,
        job_type: 'webhook_sync',
        sync_direction: 'inbound',
        priority: 7,
        status: 'queued',
        sync_results: {
          event_type: eventType,
          webhook_data: payload,
          source: 'generic_webhook'
        },
        created_at: new Date().toISOString(),
      });
    }
    
  } catch (error) {
    console.error('Generic webhook processing error:', error);
    await logWebhookDelivery(webhook.id, 'generic_webhook', payload, 'failed', 500, error.message);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const webhookId = url.searchParams.get('webhook_id');
    
    if (!webhookId) {
      return new Response(
        JSON.stringify({ error: 'Webhook ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from('integration_webhooks')
      .select(`
        *,
        integration_connections (
          tenant_id,
          provider_id,
          integration_providers (
            provider_type
          )
        )
      `)
      .eq('id', webhookId)
      .eq('is_active', true)
      .single();
    
    if (webhookError || !webhook) {
      console.error('Webhook not found:', webhookError);
      return new Response(
        JSON.stringify({ error: 'Webhook not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get request body
    const payload = await req.text();
    
    // Verify signature if webhook secret is configured
    if (webhook.webhook_secret) {
      const signature = req.headers.get(webhook.signature_header || 'X-Signature');
      
      if (!signature) {
        await logWebhookDelivery(webhook.id, 'signature_verification', { payload }, 'failed', 401, 'Missing signature');
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const isValid = verifyWebhookSignature(
        payload, 
        signature, 
        webhook.webhook_secret, 
        webhook.signature_algorithm || 'sha256'
      );
      
      if (!isValid) {
        await logWebhookDelivery(webhook.id, 'signature_verification', { payload }, 'failed', 403, 'Invalid signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Parse JSON payload
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error) {
      await logWebhookDelivery(webhook.id, 'json_parse', { payload }, 'failed', 400, 'Invalid JSON');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process webhook based on provider type
    const providerType = webhook.integration_connections?.integration_providers?.provider_type;
    
    try {
      switch (providerType) {
        case 'quickbooks':
          await processQuickBooksWebhook(webhook, parsedPayload);
          break;
        default:
          await processGenericWebhook(webhook, parsedPayload);
          break;
      }
      
      // Update webhook delivery statistics
      await supabase
        .from('integration_webhooks')
        .update({
          last_delivery_at: new Date().toISOString(),
          consecutive_failures: 0,
        })
        .eq('id', webhook.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook processed successfully' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (processingError) {
      console.error('Webhook processing failed:', processingError);
      
      // Update failure count
      await supabase
        .from('integration_webhooks')
        .update({
          consecutive_failures: (webhook.consecutive_failures || 0) + 1,
        })
        .eq('id', webhook.id);
      
      // Create alert if too many failures
      if ((webhook.consecutive_failures || 0) >= 5) {
        await supabase.from('integration_alerts').insert({
          tenant_id: webhook.integration_connections?.tenant_id,
          connection_id: webhook.connection_id,
          alert_type: 'webhook_failures',
          severity: 'error',
          title: 'Webhook Processing Failures',
          message: `Webhook ${webhook.id} has failed ${webhook.consecutive_failures + 1} consecutive times`,
          context_data: {
            webhook_id: webhook.id,
            error: processingError.message,
          },
          created_at: new Date().toISOString(),
        });
      }
      
      return new Response(
        JSON.stringify({ error: 'Webhook processing failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  success: boolean;
  deletedCounts: Record<string, number>;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { tenant_id } = await req.json();
    
    if (!tenant_id) {
      return new Response(
        JSON.stringify({ error: 'tenant_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Starting production cleanup for tenant: ${tenant_id}`);
    
    const result: CleanupResult = {
      success: true,
      deletedCounts: {},
      errors: []
    };

    // Delete in order to respect foreign key constraints
    const tablesToClean = [
      // Assessment related
      'assessment_responses',
      'assessment_reports',
      'assessment_reports_extended', 
      'assessment_opportunities',
      'assessment_error_logs',
      'assessments',
      
      // Action items
      'action_items',
      
      // Client activities and stats
      'client_activities',
      
      // Tickets and related
      'time_tracking_entries',
      'support_tickets',
      
      // Contracts and related
      'contract_payments',
      'contract_approvals',
      'contract_audit_trail',
      'contract_pricing_history',
      'contract_error_logs',
      'contracts',
      
      // Proposals and related
      'proposal_comments',
      'proposal_signatures',
      'proposal_tracking',
      'proposal_notifications',
      'proposal_approvals',
      'proposal_versions',
      'proposal_items',
      'proposals',
      
      // Financial data
      'invoice_line_items',
      'credit_notes',
      'payments',
      'invoices',
      'financial_transactions',
      'financial_anomalies',
      
      // Email marketing
      'email_analytics',
      'email_campaigns',
      'email_recipients',
      
      // Contacts (must be deleted before clients due to foreign key)
      'contacts',
      
      // Finally clients
      'clients'
    ];

    for (const table of tablesToClean) {
      try {
        console.log(`Cleaning table: ${table}`);
        
        const { data, error, count } = await supabase
          .from(table)
          .delete()
          .eq('tenant_id', tenant_id)
          .select('*', { count: 'exact' });
          
        if (error) {
          console.error(`Error deleting from ${table}:`, error);
          result.errors.push(`${table}: ${error.message}`);
          result.success = false;
        } else {
          result.deletedCounts[table] = count || 0;
          console.log(`Deleted ${count || 0} records from ${table}`);
        }
      } catch (err) {
        console.error(`Exception deleting from ${table}:`, err);
        result.errors.push(`${table}: ${err.message}`);
        result.success = false;
      }
    }

    // Clean up any remaining data in other tables that might reference deleted entities
    const additionalTables = [
      'audit_logs',
      'auth_events', 
      'api_request_logs',
      'ai_requests'
    ];

    for (const table of additionalTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .delete()
          .eq('tenant_id', tenant_id)
          .select('*', { count: 'exact' });
          
        if (!error && count && count > 0) {
          result.deletedCounts[table] = count;
          console.log(`Cleaned ${count} records from ${table}`);
        }
      } catch (err) {
        // These are optional cleanups, don't fail if they error
        console.log(`Optional cleanup failed for ${table}:`, err.message);
      }
    }

    const totalDeleted = Object.values(result.deletedCounts).reduce((sum, count) => sum + count, 0);
    console.log(`Cleanup completed. Total records deleted: ${totalDeleted}`);

    return new Response(
      JSON.stringify({
        ...result,
        message: result.success 
          ? `Successfully cleaned production data. Deleted ${totalDeleted} records.`
          : 'Cleanup completed with some errors. Check the errors array for details.'
      }),
      {
        status: result.success ? 200 : 207, // 207 Multi-Status for partial success
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Cleanup function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error during cleanup',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
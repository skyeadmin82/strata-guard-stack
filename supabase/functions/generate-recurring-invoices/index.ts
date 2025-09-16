import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringSchedule {
  id: string;
  tenant_id: string;
  client_id: string;
  invoice_title: string;
  description: string | null;
  amount: number;
  currency: string;
  tax_rate: number;
  frequency: string;
  next_billing_date: string;
  payment_terms_days: number;
  auto_send: boolean;
  total_invoices_generated: number;
  total_revenue_generated: number;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting recurring invoice generation process...');

    // Get all active schedules that are due for billing
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data: schedules, error: schedulesError } = await supabase
      .from('recurring_invoice_schedules')
      .select(`
        *,
        clients!recurring_invoice_schedules_client_id_fkey(id, name, email)
      `)
      .eq('status', 'active')
      .lte('next_billing_date', today);

    if (schedulesError) {
      throw new Error(`Error fetching schedules: ${schedulesError.message}`);
    }

    console.log(`Found ${schedules?.length || 0} schedules due for billing`);

    if (!schedules || schedules.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No schedules due for billing',
          processed: 0 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    let processedCount = 0;
    const results = [];

    for (const schedule of schedules) {
      try {
        console.log(`Processing schedule ${schedule.id} for client ${schedule.clients?.name}`);

        // Calculate billing period
        const billingDate = new Date(schedule.next_billing_date);
        const nextBillingDate = calculateNextBillingDate(billingDate, schedule.frequency);
        
        // Calculate total amount including tax
        const subtotal = schedule.amount;
        const taxAmount = subtotal * (schedule.tax_rate / 100);
        const totalAmount = subtotal + taxAmount;

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(schedule.tenant_id);

        // Create the invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            tenant_id: schedule.tenant_id,
            client_id: schedule.client_id,
            invoice_number: invoiceNumber,
            title: schedule.invoice_title,
            description: schedule.description,
            subtotal_amount: subtotal,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            currency: schedule.currency,
            status: 'generated',
            issue_date: today,
            due_date: calculateDueDate(new Date(), schedule.payment_terms_days),
            payment_terms: `Net ${schedule.payment_terms_days} days`,
            recurring_schedule_id: schedule.id,
            billing_period_start: schedule.next_billing_date,
            billing_period_end: nextBillingDate.toISOString().split('T')[0]
          })
          .select()
          .single();

        if (invoiceError) {
          throw new Error(`Error creating invoice: ${invoiceError.message}`);
        }

        console.log(`Created invoice ${invoiceNumber} for ${totalAmount} ${schedule.currency}`);

        // Create history record
        await supabase
          .from('recurring_invoice_history')
          .insert({
            tenant_id: schedule.tenant_id,
            recurring_schedule_id: schedule.id,
            invoice_id: invoice.id,
            billing_period_start: schedule.next_billing_date,
            billing_period_end: nextBillingDate.toISOString().split('T')[0],
            amount: totalAmount,
            status: 'generated',
            scheduled_date: schedule.next_billing_date,
            generated_at: new Date().toISOString()
          });

        // Update the recurring schedule
        await supabase
          .from('recurring_invoice_schedules')
          .update({
            next_billing_date: nextBillingDate.toISOString().split('T')[0],
            last_billed_date: today,
            total_invoices_generated: schedule.total_invoices_generated + 1,
            total_revenue_generated: schedule.total_revenue_generated + totalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.id);

        // If auto-send is enabled, mark for sending (could trigger email function)
        if (schedule.auto_send && schedule.clients?.email) {
          console.log(`Marking invoice ${invoiceNumber} for auto-send to ${schedule.clients.email}`);
          
          await supabase
            .from('invoices')
            .update({ 
              status: 'sent',
              sent_date: new Date().toISOString()
            })
            .eq('id', invoice.id);

          // Here you could call an email sending function
          // await supabase.functions.invoke('send-invoice-email', {
          //   body: { invoiceId: invoice.id, recipientEmail: schedule.clients.email }
          // });
        }

        processedCount++;
        results.push({
          scheduleId: schedule.id,
          invoiceId: invoice.id,
          invoiceNumber,
          amount: totalAmount,
          currency: schedule.currency,
          clientName: schedule.clients?.name,
          success: true
        });

      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
        
        // Log the error but continue processing other schedules
        results.push({
          scheduleId: schedule.id,
          error: error.message,
          success: false
        });

        // Update history with error
        await supabase
          .from('recurring_invoice_history')
          .insert({
            tenant_id: schedule.tenant_id,
            recurring_schedule_id: schedule.id,
            billing_period_start: schedule.next_billing_date,
            billing_period_end: calculateNextBillingDate(new Date(schedule.next_billing_date), schedule.frequency).toISOString().split('T')[0],
            amount: schedule.amount,
            status: 'failed',
            scheduled_date: schedule.next_billing_date,
            last_error: error.message,
            generation_attempts: 1
          });
      }
    }

    console.log(`Recurring invoice generation completed. Processed: ${processedCount}/${schedules.length}`);

    return new Response(
      JSON.stringify({
        message: 'Recurring invoice generation completed',
        processed: processedCount,
        total: schedules.length,
        results
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('Error in recurring invoice generation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

// Helper functions
function calculateNextBillingDate(currentDate: Date, frequency: string): Date {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'bi_weekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'semi_annually':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
}

function calculateDueDate(issueDate: Date, paymentTermsDays: number): string {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + paymentTermsDays);
  return dueDate.toISOString().split('T')[0];
}

async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  // Get the count of invoices for this tenant this year
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', `${year}-01-01T00:00:00Z`)
    .lt('created_at', `${year + 1}-01-01T00:00:00Z`);
  
  const sequenceNumber = String((count || 0) + 1).padStart(4, '0');
  return `${prefix}${sequenceNumber}`;
}
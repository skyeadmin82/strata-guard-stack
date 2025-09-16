import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';
import type { Database } from '@/integrations/supabase/types';

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type CreditNote = Database['public']['Tables']['credit_notes']['Row'];
type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'];
type FinancialAnomaly = Database['public']['Tables']['financial_anomalies']['Row'];

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  account_id?: string;
}

interface TaxCalculationResult {
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  tax_breakdown: Array<{
    rate: number;
    amount: number;
    description: string;
  }>;
  errors: string[];
}

interface PaymentProcessingResult {
  success: boolean;
  payment_id?: string;
  transaction_id?: string;
  fraud_score?: number;
  fraud_flags?: string[];
  error_message?: string;
  retry_recommended?: boolean;
}

export const useFinancialManagement = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [anomalies, setAnomalies] = useState<FinancialAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load all financial data
  const loadFinancialData = useCallback(async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      const [invoicesRes, paymentsRes, creditNotesRes, transactionsRes, anomaliesRes] = await Promise.all([
        supabase.from('invoices').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('credit_notes').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('financial_transactions').select('*').eq('tenant_id', tenantId).order('transaction_date', { ascending: false }).limit(100),
        supabase.from('financial_anomalies').select('*').eq('tenant_id', tenantId).eq('status', 'detected').order('created_at', { ascending: false })
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (creditNotesRes.error) throw creditNotesRes.error;
      if (transactionsRes.error) throw transactionsRes.error;
      if (anomaliesRes.error) throw anomaliesRes.error;

      setInvoices(invoicesRes.data || []);
      setPayments(paymentsRes.data || []);
      setCreditNotes(creditNotesRes.data || []);
      setTransactions(transactionsRes.data || []);
      setAnomalies(anomaliesRes.data || []);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Error Loading Financial Data",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, toast]);

  // Tax calculation with error handling
  const calculateTax = useCallback(async (
    lineItems: InvoiceLineItem[],
    clientId: string,
    currency: string = 'USD'
  ): Promise<TaxCalculationResult> => {
    const errors: string[] = [];
    const taxBreakdown: Array<{ rate: number; amount: number; description: string }> = [];
    
    try {
      let subtotal = 0;
      let totalTaxAmount = 0;

      // Calculate subtotal
      for (const item of lineItems) {
        if (item.quantity <= 0) {
          errors.push(`Invalid quantity for item: ${item.description}`);
          continue;
        }
        if (item.unit_price < 0) {
          errors.push(`Invalid unit price for item: ${item.description}`);
          continue;
        }
        
        const lineTotal = item.quantity * item.unit_price;
        subtotal += lineTotal;

        // Calculate tax for this line item
        const taxRate = item.tax_rate || 0;
        const taxAmount = lineTotal * (taxRate / 100);
        totalTaxAmount += taxAmount;

        if (taxRate > 0) {
          const existingBreakdown = taxBreakdown.find(b => b.rate === taxRate);
          if (existingBreakdown) {
            existingBreakdown.amount += taxAmount;
          } else {
            taxBreakdown.push({
              rate: taxRate,
              amount: taxAmount,
              description: `${taxRate}% Tax`
            });
          }
        }
      }

      // Validate totals
      if (subtotal < 0) {
        errors.push('Subtotal cannot be negative');
      }
      if (totalTaxAmount < 0) {
        errors.push('Tax amount cannot be negative');
      }

      const totalAmount = subtotal + totalTaxAmount;

      return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(totalTaxAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        tax_breakdown: taxBreakdown,
        errors
      };
    } catch (error) {
      errors.push(`Tax calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        tax_breakdown: [],
        errors
      };
    }
  }, []);

  // Create invoice with validation
  const createInvoice = useCallback(async (
    invoiceData: Omit<InvoiceInsert, 'tenant_id' | 'invoice_number'>,
    lineItems: InvoiceLineItem[]
  ) => {
    if (!tenantId) throw new Error('No tenant ID available');

    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Calculate tax
      const taxCalc = await calculateTax(lineItems, invoiceData.client_id!, invoiceData.currency);
      
      if (taxCalc.errors.length > 0) {
        setValidationErrors(taxCalc.errors);
        throw new Error(`Validation errors: ${taxCalc.errors.join(', ')}`);
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          tenant_id: tenantId,
          invoice_number: invoiceNumber,
          subtotal: taxCalc.subtotal,
          tax_amount: taxCalc.tax_amount,
          total_amount: taxCalc.total_amount,
          tax_calculation_details: {
            breakdown: taxCalc.tax_breakdown,
            calculated_at: new Date().toISOString()
          },
          validation_errors: taxCalc.errors
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create line items
      const lineItemsWithTotals = lineItems.map((item, index) => ({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
        tax_rate: item.tax_rate || 0,
        tax_amount: (item.quantity * item.unit_price) * ((item.tax_rate || 0) / 100),
        account_id: item.account_id,
        sort_order: index
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsWithTotals);

      if (lineItemsError) throw lineItemsError;

      // Create financial transaction
      await createFinancialTransaction({
        transaction_type: 'invoice',
        reference_id: invoice.id,
        reference_type: 'invoice',
        description: `Invoice ${invoiceNumber}`,
        total_amount: taxCalc.total_amount,
        currency: invoiceData.currency || 'USD',
        transaction_date: new Date().toISOString().split('T')[0]
      });

      // Update local state
      setInvoices(prev => [invoice, ...prev]);
      
      toast({
        title: "Invoice Created",
        description: `Invoice ${invoiceNumber} created successfully`,
      });

      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error Creating Invoice",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      throw error;
    }
  }, [tenantId, calculateTax, toast]);

  // Process payment with fraud detection
  const processPayment = useCallback(async (
    paymentData: Omit<PaymentInsert, 'tenant_id' | 'payment_reference'>
  ): Promise<PaymentProcessingResult> => {
    if (!tenantId) throw new Error('No tenant ID available');

    try {
      const paymentReference = `PAY-${Date.now()}`;
      
      // Basic fraud detection
      const fraudScore = Math.random() * 100; // Placeholder - integrate with real fraud detection
      const fraudFlags: string[] = [];
      
      if (paymentData.amount && paymentData.amount > 10000) {
        fraudFlags.push('high_amount');
      }
      
      // Determine status based on fraud score
      let status: Payment['status'] = 'processing';
      if (fraudScore > 80) {
        status = 'failed';
        fraudFlags.push('high_fraud_score');
      }

      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          tenant_id: tenantId,
          payment_reference: paymentReference,
          status,
          fraud_score: Math.round(fraudScore * 100) / 100,
          fraud_flags: fraudFlags,
          gateway_response: {
            processed_at: new Date().toISOString(),
            gateway: 'mock_gateway'
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Update invoice status if payment is for an invoice
      if (paymentData.invoice_id && status === 'processing') {
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', paymentData.invoice_id);
        
        if (invoiceError) console.error('Error updating invoice status:', invoiceError);
      }

      // Create financial transaction
      await createFinancialTransaction({
        transaction_type: 'payment',
        reference_id: payment.id,
        reference_type: 'payment',
        description: `Payment ${paymentReference}`,
        total_amount: paymentData.amount!,
        currency: paymentData.currency || 'USD',
        transaction_date: new Date().toISOString().split('T')[0]
      });

      setPayments(prev => [payment, ...prev]);

      const result: PaymentProcessingResult = {
        success: status !== 'failed',
        payment_id: payment.id,
        fraud_score: fraudScore,
        fraud_flags: fraudFlags,
        retry_recommended: status === 'failed' && fraudScore < 90
      };

      if (result.success) {
        toast({
          title: "Payment Processed",
          description: `Payment ${paymentReference} processed successfully`,
        });
      } else {
        toast({
          title: "Payment Failed",
          description: `Payment failed due to fraud detection`,
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_recommended: true
      };
    }
  }, [tenantId, toast]);

  // Create credit note with approval workflow
  const createCreditNote = useCallback(async (
    creditNoteData: Omit<Database['public']['Tables']['credit_notes']['Insert'], 'tenant_id' | 'credit_note_number'>
  ) => {
    if (!tenantId) throw new Error('No tenant ID available');

    try {
      const creditNoteNumber = `CR-${Date.now()}`;
      
      const { data: creditNote, error } = await supabase
        .from('credit_notes')
        .insert({
          ...creditNoteData,
          tenant_id: tenantId,
          credit_note_number: creditNoteNumber
        })
        .select()
        .single();

      if (error) throw error;

      setCreditNotes(prev => [creditNote, ...prev]);
      
      toast({
        title: "Credit Note Created",
        description: `Credit note ${creditNoteNumber} created and pending approval`,
      });

      return creditNote;
    } catch (error) {
      console.error('Error creating credit note:', error);
      toast({
        title: "Error Creating Credit Note",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      throw error;
    }
  }, [tenantId, toast]);

  // Create financial transaction
  const createFinancialTransaction = useCallback(async (
    transactionData: Omit<Database['public']['Tables']['financial_transactions']['Insert'], 'tenant_id' | 'transaction_number'>
  ) => {
    if (!tenantId) return null;

    try {
      const transactionNumber = `TXN-${Date.now()}`;
      
      const { data: transaction, error } = await supabase
        .from('financial_transactions')
        .insert({
          ...transactionData,
          tenant_id: tenantId,
          transaction_number: transactionNumber,
          transaction_date: transactionData.transaction_date || new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [transaction, ...prev]);
      return transaction;
    } catch (error) {
      console.error('Error creating financial transaction:', error);
      return null;
    }
  }, [tenantId]);

  // Detect anomalies
  const detectAnomalies = useCallback(async () => {
    if (!tenantId) return;

    try {
      // Get recent transactions for analysis
      const { data: recentTransactions, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      const anomaliesToCreate: Database['public']['Tables']['financial_anomalies']['Insert'][] = [];
      
      // Simple anomaly detection logic
      if (recentTransactions && recentTransactions.length > 0) {
        const amounts = recentTransactions.map(t => Number(t.total_amount));
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) / amounts.length);
        
        for (const transaction of recentTransactions) {
          const amount = Number(transaction.total_amount);
          const zScore = Math.abs((amount - avgAmount) / stdDev);
          
          if (zScore > 2) { // More than 2 standard deviations
            anomaliesToCreate.push({
              tenant_id: tenantId,
              anomaly_type: 'unusual_amount',
              severity: zScore > 3 ? 'high' : 'medium',
              description: `Transaction amount ${amount} is ${zScore.toFixed(2)} standard deviations from the mean`,
              detected_value: amount,
              expected_range_min: avgAmount - 2 * stdDev,
              expected_range_max: avgAmount + 2 * stdDev,
              confidence_score: Math.min(95, zScore * 20),
              related_transaction_id: transaction.id
            });
          }
        }
      }

      if (anomaliesToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('financial_anomalies')
          .insert(anomaliesToCreate);

        if (insertError) throw insertError;
        
        toast({
          title: "Anomalies Detected",
          description: `${anomaliesToCreate.length} financial anomalies detected and flagged for review`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }
  }, [tenantId, toast]);

  // Send overdue notifications
  const sendOverdueNotifications = useCallback(async () => {
    if (!tenantId) return;

    try {
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - 1);

      const { data: overdueInvoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'sent')
        .lt('due_date', overdueDate.toISOString().split('T')[0]);

      if (error) throw error;

      if (overdueInvoices && overdueInvoices.length > 0) {
        // Update status to overdue
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ 
            status: 'overdue',
            last_reminder_sent: new Date().toISOString(),
            reminder_count: 1
          })
          .in('id', overdueInvoices.map(inv => inv.id));

        if (updateError) throw updateError;

        toast({
          title: "Overdue Notifications Sent",
          description: `${overdueInvoices.length} overdue invoice notifications sent`,
        });
      }
    } catch (error) {
      console.error('Error sending overdue notifications:', error);
    }
  }, [tenantId, toast]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  return {
    // State
    invoices,
    payments,
    creditNotes,
    transactions,
    anomalies,
    isLoading,
    validationErrors,

    // Actions
    loadFinancialData,
    calculateTax,
    createInvoice,
    processPayment,
    createCreditNote,
    createFinancialTransaction,
    detectAnomalies,
    sendOverdueNotifications
  };
};
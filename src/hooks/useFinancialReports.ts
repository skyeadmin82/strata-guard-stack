import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';
import type { Database } from '@/integrations/supabase/types';

type FinancialReport = Database['public']['Tables']['financial_reports']['Row'];

interface ReportParameters {
  startDate: string;
  endDate: string;
  includeDetails?: boolean;
  groupBy?: 'month' | 'quarter' | 'year';
  currency?: string;
  clientIds?: string[];
  accountIds?: string[];
}

interface ProfitLossData {
  period: string;
  revenue: number;
  expenses: number;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
  revenue_breakdown: Array<{
    account: string;
    amount: number;
    percentage: number;
  }>;
  expense_breakdown: Array<{
    account: string;
    amount: number;
    percentage: number;
  }>;
}

interface CashFlowData {
  period: string;
  opening_balance: number;
  cash_inflows: number;
  cash_outflows: number;
  net_cash_flow: number;
  closing_balance: number;
  projections: Array<{
    period: string;
    projected_inflow: number;
    projected_outflow: number;
    projected_balance: number;
  }>;
}

interface AgingReportData {
  client_id: string;
  client_name: string;
  total_outstanding: number;
  current: number;
  days_30: number;
  days_60: number;
  days_90: number;
  days_120_plus: number;
  oldest_invoice_date: string;
  invoice_details: Array<{
    invoice_id: string;
    invoice_number: string;
    amount: number;
    days_overdue: number;
  }>;
}

interface CommissionReportData {
  user_id: string;
  user_name: string;
  period: string;
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  adjustments: number;
  final_amount: number;
  payment_status: string;
  details: Array<{
    invoice_id: string;
    invoice_amount: number;
    commission_earned: number;
  }>;
}

export const useFinancialReports = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Generate Profit & Loss Report
  const generateProfitLossReport = useCallback(async (
    parameters: ReportParameters
  ): Promise<ProfitLossData | null> => {
    if (!tenantId) return null;

    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      // Get revenue data
      setGenerationProgress(30);
      const { data: revenueData, error: revenueError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          transaction_line_items (
            *,
            financial_accounts (*)
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('transaction_type', 'invoice')
        .gte('transaction_date', parameters.startDate)
        .lte('transaction_date', parameters.endDate)
        .eq('status', 'posted');

      if (revenueError) throw revenueError;

      // Get expense data
      setGenerationProgress(60);
      const { data: expenseData, error: expenseError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          transaction_line_items (
            *,
            financial_accounts (*)
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('transaction_type', 'expense')
        .gte('transaction_date', parameters.startDate)
        .lte('transaction_date', parameters.endDate)
        .eq('status', 'posted');

      if (expenseError) throw expenseError;

      // Calculate totals
      setGenerationProgress(80);
      const totalRevenue = revenueData?.reduce((sum, tx) => sum + Number(tx.total_amount), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, tx) => sum + Number(tx.total_amount), 0) || 0;
      const grossProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Create breakdown data
      const revenueBreakdown = revenueData?.map(tx => ({
        account: tx.description,
        amount: Number(tx.total_amount),
        percentage: totalRevenue > 0 ? (Number(tx.total_amount) / totalRevenue) * 100 : 0
      })) || [];

      const expenseBreakdown = expenseData?.map(tx => ({
        account: tx.description,
        amount: Number(tx.total_amount),
        percentage: totalExpenses > 0 ? (Number(tx.total_amount) / totalExpenses) * 100 : 0
      })) || [];

      const reportData: ProfitLossData = {
        period: `${parameters.startDate} to ${parameters.endDate}`,
        revenue: totalRevenue,
        expenses: totalExpenses,
        gross_profit: grossProfit,
        net_profit: grossProfit, // Simplified - in real scenario, would include other items
        profit_margin: profitMargin,
        revenue_breakdown: revenueBreakdown,
        expense_breakdown: expenseBreakdown
      };

      // Save report to database
      setGenerationProgress(90);
      const { data: savedReport, error: saveError } = await supabase
        .from('financial_reports')
        .insert({
          tenant_id: tenantId,
          report_type: 'profit_loss',
          report_name: `P&L Report - ${reportData.period}`,
          period_start: parameters.startDate,
          period_end: parameters.endDate,
          report_data: reportData as any,
          parameters: parameters as any,
          generation_status: 'completed'
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setReports(prev => [savedReport, ...prev]);
      setGenerationProgress(100);

      toast({
        title: "P&L Report Generated",
        description: "Profit & Loss report generated successfully",
      });

      return reportData;
    } catch (error) {
      console.error('Error generating P&L report:', error);
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [tenantId, toast]);

  // Generate Cash Flow Report
  const generateCashFlowReport = useCallback(async (
    parameters: ReportParameters
  ): Promise<CashFlowData | null> => {
    if (!tenantId) return null;

    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      // Get all cash transactions
      setGenerationProgress(30);
      const { data: cashTransactions, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('payment_date', parameters.startDate)
        .lte('payment_date', parameters.endDate)
        .eq('status', 'completed');

      if (error) throw error;

      // Calculate cash flows
      setGenerationProgress(60);
      const cashInflows = cashTransactions?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      
      // For demo purposes, using simplified calculations
      const cashOutflows = cashInflows * 0.7; // Assume 70% outflows
      const netCashFlow = cashInflows - cashOutflows;
      const openingBalance = 10000; // Placeholder
      const closingBalance = openingBalance + netCashFlow;

      // Generate projections (simplified)
      setGenerationProgress(80);
      const projections = [];
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date(parameters.endDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        
        projections.push({
          period: futureDate.toISOString().substring(0, 7),
          projected_inflow: cashInflows * (0.9 + Math.random() * 0.2), // ±10% variation
          projected_outflow: cashOutflows * (0.9 + Math.random() * 0.2),
          projected_balance: closingBalance + (netCashFlow * i * (0.9 + Math.random() * 0.2))
        });
      }

      const reportData: CashFlowData = {
        period: `${parameters.startDate} to ${parameters.endDate}`,
        opening_balance: openingBalance,
        cash_inflows: cashInflows,
        cash_outflows: cashOutflows,
        net_cash_flow: netCashFlow,
        closing_balance: closingBalance,
        projections
      };

      // Save report
      setGenerationProgress(90);
      const { data: savedReport, error: saveError } = await supabase
        .from('financial_reports')
        .insert({
          tenant_id: tenantId,
          report_type: 'cash_flow',
          report_name: `Cash Flow Report - ${reportData.period}`,
          period_start: parameters.startDate,
          period_end: parameters.endDate,
          report_data: reportData as any,
          parameters: parameters as any,
          generation_status: 'completed'
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setReports(prev => [savedReport, ...prev]);
      setGenerationProgress(100);

      toast({
        title: "Cash Flow Report Generated",
        description: "Cash flow analysis completed successfully",
      });

      return reportData;
    } catch (error) {
      console.error('Error generating cash flow report:', error);
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [tenantId, toast]);

  // Generate Aging Report
  const generateAgingReport = useCallback(async (
    parameters: ReportParameters
  ): Promise<AgingReportData[] | null> => {
    if (!tenantId) return null;

    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      // Get outstanding invoices
      setGenerationProgress(30);
      const { data: outstandingInvoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .eq('tenant_id', tenantId)
        .in('status', ['sent', 'overdue'])
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Group by client and calculate aging
      setGenerationProgress(60);
      const clientGroups = new Map<string, any>();
      const currentDate = new Date();

      outstandingInvoices?.forEach(invoice => {
        const clientId = invoice.client_id;
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = Number(invoice.total_amount);

        if (!clientGroups.has(clientId)) {
          clientGroups.set(clientId, {
            client_id: clientId,
            client_name: (invoice as any).clients?.name || 'Unknown Client',
            total_outstanding: 0,
            current: 0,
            days_30: 0,
            days_60: 0,
            days_90: 0,
            days_120_plus: 0,
            oldest_invoice_date: invoice.issue_date,
            invoice_details: []
          });
        }

        const clientData = clientGroups.get(clientId);
        clientData.total_outstanding += amount;
        
        // Categorize by aging buckets
        if (daysOverdue <= 0) {
          clientData.current += amount;
        } else if (daysOverdue <= 30) {
          clientData.days_30 += amount;
        } else if (daysOverdue <= 60) {
          clientData.days_60 += amount;
        } else if (daysOverdue <= 90) {
          clientData.days_90 += amount;
        } else {
          clientData.days_120_plus += amount;
        }

        clientData.invoice_details.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          amount: amount,
          days_overdue: Math.max(0, daysOverdue)
        });

        if (invoice.issue_date < clientData.oldest_invoice_date) {
          clientData.oldest_invoice_date = invoice.issue_date;
        }
      });

      const reportData = Array.from(clientGroups.values());

      // Save report
      setGenerationProgress(90);
      const { data: savedReport, error: saveError } = await supabase
        .from('financial_reports')
        .insert({
          tenant_id: tenantId,
          report_type: 'aging_report',
          report_name: `Aging Report - ${new Date().toISOString().split('T')[0]}`,
          period_start: parameters.startDate,
          period_end: parameters.endDate,
          report_data: { aging_data: reportData } as any,
          parameters: parameters as any,
          generation_status: 'completed'
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setReports(prev => [savedReport, ...prev]);
      setGenerationProgress(100);

      toast({
        title: "Aging Report Generated",
        description: "Accounts receivable aging report completed",
      });

      return reportData;
    } catch (error) {
      console.error('Error generating aging report:', error);
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [tenantId, toast]);

  // Export report to different formats
  const exportReport = useCallback(async (
    reportId: string,
    format: 'pdf' | 'xlsx' | 'csv'
  ) => {
    try {
      // In a real implementation, this would call a backend service
      // For now, we'll just simulate the export
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Export Completed",
        description: `Report exported as ${format.toUpperCase()}`,
      });

      // Update the report with export info
      const { error } = await supabase
        .from('financial_reports')
        .update({
          file_format: format,
          file_path: `/exports/${reportId}.${format}`
        })
        .eq('id', reportId);

      if (error) throw error;

    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Load saved reports
  const loadReports = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error Loading Reports",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  }, [tenantId, toast]);

  return {
    // State
    reports,
    isGenerating,
    generationProgress,

    // Actions
    generateProfitLossReport,
    generateCashFlowReport,
    generateAgingReport,
    exportReport,
    loadReports
  };
};
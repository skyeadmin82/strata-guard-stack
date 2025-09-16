import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface BIReport {
  id: string;
  name: string;
  description?: string;
  report_type: 'dashboard' | 'chart' | 'table' | 'export';
  data_sources: string[];
  query_definition: any;
  chart_config: any;
  filters: any;
  status: 'active' | 'inactive' | 'error';
  last_generated_at?: string;
  last_error?: string;
  error_count: number;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }>;
}

interface ReportGenerationOptions {
  useCache?: boolean;
  exportFormat?: 'pdf' | 'csv' | 'xlsx';
  fallbackToTable?: boolean;
}

export const useBusinessIntelligence = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  const createReport = useCallback(async (reportConfig: Partial<BIReport>) => {
    try {
      const { data, error } = await supabase
        .from('bi_reports')
        .insert({
          name: reportConfig.name || 'Untitled Report',
          description: reportConfig.description,
          report_type: reportConfig.report_type || 'dashboard',
          data_sources: reportConfig.data_sources || [],
          query_definition: reportConfig.query_definition || {},
          chart_config: reportConfig.chart_config || {},
          filters: reportConfig.filters || {}
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Report Created",
        description: `Report "${data.name}" has been created successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create report",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const generateReport = useCallback(async (
    reportId: string,
    options: ReportGenerationOptions = {}
  ) => {
    setIsGenerating(true);
    
    try {
      const startTime = Date.now();

      // Get report configuration
      const { data: report, error: reportError } = await supabase
        .from('bi_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;

      // Check cache if enabled
      if (options.useCache && report.last_generated_at) {
        const cacheAge = Date.now() - new Date(report.last_generated_at).getTime();
        if (cacheAge < (report.cache_ttl || 3600) * 1000) {
          setReportData(report.cached_data);
          return { success: true, cached: true };
        }
      }

      let reportResult;
      
      try {
        // Try to generate chart/visualization
        reportResult = await generateVisualization(report);
      } catch (vizError) {
        console.error('Visualization generation failed:', vizError);
        
        // Fallback to table format if chart fails
        if (options.fallbackToTable) {
          reportResult = await generateTableFallback(report);
        } else {
          throw vizError;
        }
      }

      const generationTime = Date.now() - startTime;

      // Update report with results
      await supabase
        .from('bi_reports')
        .update({
          last_generated_at: new Date().toISOString(),
          generation_time_ms: generationTime,
          cached_data: reportResult.data,
          last_error: null,
          error_count: 0
        })
        .eq('id', reportId);

      setReportData(reportResult.data);
      setChartData(reportResult.chartData);

      toast({
        title: "Report Generated",
        description: `Report generated in ${generationTime}ms${reportResult.fallbackUsed ? ' (table fallback)' : ''}`,
      });

      return { success: true, data: reportResult.data, fallbackUsed: reportResult.fallbackUsed };

    } catch (error) {
      console.error('Report generation error:', error);
      
      // Update error tracking
      await supabase
        .from('bi_reports')
        .update({
          last_error: error instanceof Error ? error.message : 'Unknown error',
          error_count: supabase.rpc('increment_error_count', { report_id: reportId })
        })
        .eq('id', reportId);

      // Try emergency fallback
      const fallbackResult = await generateEmergencyFallback(reportId);
      if (fallbackResult.success) {
        setReportData(fallbackResult.data);
        toast({
          title: "Report Generated (Fallback)",
          description: "Using simplified data due to processing issues",
          variant: "destructive",
        });
        return fallbackResult;
      }

      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });

      return { success: false };
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const generateVisualization = async (report: BIReport) => {
    // Execute data query based on report configuration
    const queryResult = await executeDataQuery(report.query_definition);
    
    if (!queryResult.success) {
      throw new Error('Data query failed: ' + queryResult.error);
    }

    const data = queryResult.data;
    
    // Generate chart configuration
    let chartData: ChartData | null = null;
    
    if (report.report_type === 'chart' && report.chart_config.type) {
      chartData = formatDataForChart(data, report.chart_config);
    }

    return {
      success: true,
      data,
      chartData,
      fallbackUsed: false
    };
  };

  const generateTableFallback = async (report: BIReport) => {
    // Simplified table generation
    const queryResult = await executeDataQuery(report.query_definition, { simplified: true });
    
    return {
      success: true,
      data: queryResult.data,
      chartData: null,
      fallbackUsed: true
    };
  };

  const generateEmergencyFallback = async (reportId: string) => {
    try {
      // Generate basic summary data
      const summaryData = await generateBasicSummary();
      
      return {
        success: true,
        data: summaryData,
        fallbackUsed: true
      };
    } catch (error) {
      return { success: false };
    }
  };

  const executeDataQuery = async (queryDef: any, options: { simplified?: boolean } = {}) => {
    try {
      // Validate query for safety
      if (!validateQuery(queryDef)) {
        throw new Error('Invalid or unsafe query');
      }

      let query = supabase.from(queryDef.table).select(queryDef.columns || '*');

      // Apply filters
      if (queryDef.filters) {
        Object.entries(queryDef.filters).forEach(([field, value]: [string, any]) => {
          if (value !== null && value !== undefined) {
            query = query.eq(field, value);
          }
        });
      }

      // Apply date range if specified
      if (queryDef.dateRange) {
        query = query
          .gte(queryDef.dateField || 'created_at', queryDef.dateRange.start)
          .lte(queryDef.dateField || 'created_at', queryDef.dateRange.end);
      }

      // Apply ordering
      if (queryDef.orderBy) {
        query = query.order(queryDef.orderBy.field, { 
          ascending: queryDef.orderBy.ascending !== false 
        });
      }

      // Limit results for performance
      const limit = options.simplified ? 100 : (queryDef.limit || 1000);
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Query execution error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Query failed' 
      };
    }
  };

  const validateQuery = (queryDef: any): boolean => {
    // Basic validation to prevent dangerous queries
    if (!queryDef.table || typeof queryDef.table !== 'string') return false;
    
    // Whitelist allowed tables (customize based on your schema)
    const allowedTables = [
      'clients', 'contracts', 'assessments', 'proposals', 
      'payment_transactions', 'audit_logs', 'support_tickets'
    ];
    
    return allowedTables.includes(queryDef.table);
  };

  const formatDataForChart = (data: any[], chartConfig: any): ChartData => {
    const { type, xField, yField, groupBy } = chartConfig;

    if (type === 'pie' || type === 'doughnut') {
      const grouped = data.reduce((acc, item) => {
        const key = item[groupBy || xField];
        acc[key] = (acc[key] || 0) + (Number(item[yField]) || 1);
        return acc;
      }, {});

      return {
        labels: Object.keys(grouped),
        datasets: [{
          label: 'Data',
          data: Object.values(grouped) as number[],
          backgroundColor: generateColors(Object.keys(grouped).length)
        }]
      };
    }

    // Line/Bar charts
    const labels = [...new Set(data.map(item => item[xField]))];
    const values = labels.map(label => {
      const items = data.filter(item => item[xField] === label);
      return items.reduce((sum, item) => sum + (Number(item[yField]) || 0), 0);
    });

    return {
      labels,
      datasets: [{
        label: yField,
        data: values,
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)'
      }]
    };
  };

  const generateColors = (count: number): string[] => {
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--secondary))',
      'hsl(var(--accent))',
      'hsl(var(--muted))'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  };

  const generateBasicSummary = async () => {
    // Generate basic counts and summaries from key tables
    try {
      const [clientsCount, contractsCount, proposalsCount] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('contracts').select('id', { count: 'exact', head: true }),
        supabase.from('proposals').select('id', { count: 'exact', head: true })
      ]);

      return {
        summary: {
          clients: clientsCount.count || 0,
          contracts: contractsCount.count || 0,
          proposals: proposalsCount.count || 0
        },
        generated_at: new Date().toISOString(),
        note: 'Basic summary - detailed reporting temporarily unavailable'
      };
    } catch (error) {
      return {
        summary: { note: 'Unable to generate summary' },
        generated_at: new Date().toISOString()
      };
    }
  };

  const exportReport = useCallback(async (reportId: string, format: 'pdf' | 'csv' | 'xlsx') => {
    try {
      const { data, error } = await supabase.functions.invoke('export-report', {
        body: { reportId, format }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Report exported as ${format.toUpperCase()}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export report",
        variant: "destructive",
      });
      return { success: false };
    }
  }, [toast]);

  const getReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bi_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }, []);

  return {
    createReport,
    generateReport,
    exportReport,
    getReports,
    isGenerating,
    reportData,
    chartData
  };
};
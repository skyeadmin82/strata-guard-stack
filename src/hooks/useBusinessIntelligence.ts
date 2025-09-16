import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTenant } from './useTenant';
import type { Database } from '@/integrations/supabase/types';

type BIReport = Database['public']['Tables']['bi_reports']['Row'];

export const useBusinessIntelligence = () => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<BIReport | null>(null);

  const createReport = useCallback(async (reportConfig: Partial<BIReport>) => {
    if (!tenantId) {
      throw new Error('Tenant not loaded');
    }

    try {
      const { data, error } = await supabase
        .from('bi_reports')
        .insert({
          tenant_id: tenantId,
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
  }, [toast, tenantId]);

  const generateReport = useCallback(async (reportId: string) => {
    if (!tenantId) {
      throw new Error('Tenant not loaded');
    }

    setIsGenerating(true);
    
    try {
      // Get report configuration
      const { data: report, error: reportError } = await supabase
        .from('bi_reports')
        .select('*')
        .eq('id', reportId)
        .eq('tenant_id', tenantId)
        .single();

      if (reportError) throw reportError;
      
      setCurrentReport(report);

      // Generate fresh data
      const result = await generateReportData(report);
      
      if (result.success && result.data) {
        // Update report with new data
        await supabase
          .from('bi_reports')
          .update({
            last_generated_at: new Date().toISOString(),
            generation_time_ms: result.generationTime
          })
          .eq('id', reportId);

        toast({
          title: "Report Generated",
          description: "Report data has been generated successfully",
        });
      }

      return result;

    } catch (error) {
      console.error('Report generation error:', error);
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsGenerating(false);
      setCurrentReport(null);
    }
  }, [toast, tenantId]);

  const generateReportData = async (report: BIReport) => {
    const startTime = Date.now();
    
    try {
      const queryDef = report.query_definition as any;
      let data: any[] = [];

      // Execute queries based on data sources
      const dataSources = Array.isArray(report.data_sources) 
        ? report.data_sources as string[]
        : JSON.parse(report.data_sources as string);

      for (const source of dataSources) {
        const sourceData = await fetchDataFromSource(source, queryDef);
        data = [...data, ...sourceData];
      }

      // Apply transformations
      if (queryDef.transformations) {
        for (const transformation of queryDef.transformations) {
          data = applyTransformation(data, transformation);
        }
      }

      // Apply filters
      if (report.filters) {
        const filters = report.filters as any;
        data = applyFilters(data, filters);
      }

      return {
        success: true,
        data,
        generationTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Data generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data generation failed',
        generationTime: Date.now() - startTime
      };
    }
  };

  const fetchDataFromSource = async (source: string, queryDef: any) => {
      const { data, error } = await supabase
        .from('clients' as any)
        .select(queryDef.select || '*')
        .limit(queryDef.limit || 1000);

    if (error) throw error;
    return data || [];
  };

  const applyTransformation = (data: any[], transformation: any) => {
    const { type, params } = transformation;

    switch (type) {
      case 'aggregate':
        return aggregateData(data, params);
      case 'group_by':
        return groupData(data, params);
      case 'sort':
        return data.sort((a, b) => {
          const aVal = a[params.field];
          const bVal = b[params.field];
          return params.order === 'desc' ? bVal - aVal : aVal - bVal;
        });
      default:
        return data;
    }
  };

  const aggregateData = (data: any[], params: any) => {
    switch (params.function) {
      case 'sum':
        return data.reduce((sum, item) => sum + (item[params.field] || 0), 0);
      case 'avg':
        return data.reduce((sum, item) => sum + (item[params.field] || 0), 0) / data.length;
      case 'count':
        return data.length;
      default:
        return data;
    }
  };

  const groupData = (data: any[], params: any) => {
    return data.reduce((groups, item) => {
      const key = item[params.field];
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  };

  const applyFilters = (data: any[], filters: any) => {
    return data.filter((item) => {
      return Object.entries(filters).every(([field, condition]: [string, any]) => {
        const value = item[field];
        
        switch (condition.operator) {
          case 'equals':
            return value === condition.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
          case 'greater_than':
            return value > condition.value;
          case 'less_than':
            return value < condition.value;
          default:
            return true;
        }
      });
    });
  };

  const getReports = useCallback(async () => {
    if (!tenantId) return [];

    try {
      const { data, error } = await supabase
        .from('bi_reports')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }, [tenantId]);

  const exportReport = useCallback(async (reportId: string, format: string) => {
    if (!tenantId) return { success: false, error: 'Tenant not loaded' };

    try {
      const result = await generateReport(reportId);
      
      if (result.success && result.data) {
        // Here you would implement actual export logic
        const exportData = formatDataForExport(result.data, format);
        
        toast({
          title: "Export Successful",
          description: `Report exported as ${format.toUpperCase()}`,
        });
        
        return { success: true, data: exportData };
      }

      return { success: false, error: 'Failed to generate data for export' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Export failed' 
      };
    }
  }, [generateReport, toast, tenantId]);

  const formatDataForExport = (data: any[], format: string) => {
    switch (format) {
      case 'csv':
        return convertToCSV(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      default:
        return data;
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => 
        JSON.stringify(row[header] ?? '')
      ).join(','))
    ];
    
    return csvRows.join('\n');
  };

  return {
    createReport,
    generateReport,
    getReports,
    exportReport,
    isGenerating,
    currentReport
  };
};
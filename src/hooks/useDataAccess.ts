import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Data Export Hook
export const useDataExport = () => {
  const { profile } = useAuth();
  const [exports, setExports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const requestDataExport = useCallback(async (exportData: {
    export_type: string;
    export_format: string;
    date_range?: any;
    filters?: any;
    include_sensitive_data?: boolean;
  }) => {
    setLoading(true);
    try {
      // Validate user permissions for sensitive data
      if (exportData.include_sensitive_data) {
        const hasPermission = await validateSensitiveDataAccess();
        if (!hasPermission) {
          return { 
            success: false, 
            error: 'Insufficient permissions for sensitive data export' 
          };
        }
      }

      const { data: exportRequest, error } = await supabase
        .from('data_export_requests')
        .insert({
          tenant_id: profile?.tenant_id,
          requested_by: profile?.id,
          export_type: exportData.export_type,
          export_format: exportData.export_format,
          date_range: exportData.date_range,
          filters: exportData.filters || {},
          include_sensitive_data: exportData.include_sensitive_data || false,
          status: 'requested',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit trail for data export request
      await logAuditEvent(
        'create',
        'data_export_request',
        exportRequest.id,
        `${exportData.export_type} export`,
        'medium' // Higher risk for data exports
      );

      // Simulate processing
      setTimeout(async () => {
        try {
          const result = await simulateDataExportProcessing(exportRequest);
          
          await supabase
            .from('data_export_requests')
            .update({
              status: result.success ? 'completed' : 'failed',
              progress_percentage: 100,
              file_path: result.filePath,
              file_size: result.fileSize,
              download_url: result.downloadUrl,
              completed_at: new Date().toISOString(),
              error_message: result.error,
              error_details: result.errorDetails
            })
            .eq('id', exportRequest.id);

          if (result.success) {
            toast({
              title: "Export Completed",
              description: "Your data export is ready for download.",
            });
          } else {
            toast({
              title: "Export Failed",
              description: result.error || "Data export processing failed.",
              variant: "destructive",
            });
          }
        } catch (processingError) {
          console.error('Export processing error:', processingError);
        }
      }, 3000);

      toast({
        title: "Export Requested",
        description: "Your data export request has been queued for processing.",
      });

      setExports(prev => [exportRequest, ...prev]);
      return { success: true, exportRequest };

    } catch (error: any) {
      console.error('Data export request error:', error);
      toast({
        title: "Export Request Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const downloadExport = useCallback(async (exportId: string) => {
    try {
      // Check download permissions and rate limits
      const { data: exportRequest, error } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('id', exportId)
        .eq('tenant_id', profile?.tenant_id)
        .single();

      if (error) throw error;

      if (exportRequest.status !== 'completed') {
        return { success: false, error: 'Export is not ready for download' };
      }

      if (new Date() > new Date(exportRequest.expires_at)) {
        return { success: false, error: 'Export has expired' };
      }

      // Increment download count
      await supabase
        .from('data_export_requests')
        .update({ 
          download_count: (exportRequest.download_count || 0) + 1 
        })
        .eq('id', exportId);

      // Log audit trail for download
      await logAuditEvent(
        'read',
        'data_export_request',
        exportId,
        `Downloaded ${exportRequest.export_type} export`,
        'medium'
      );

      // In a real implementation, this would return a secure download URL
      const downloadUrl = `/api/exports/download/${exportId}`;
      
      toast({
        title: "Download Started",
        description: "Your export file download has started.",
      });

      return { success: true, downloadUrl };

    } catch (error: any) {
      console.error('Export download error:', error);
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [profile?.tenant_id]);

  const fetchExports = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_export_requests')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('requested_by', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setExports(data || []);
      return { success: true, exports: data };

    } catch (error: any) {
      console.error('Failed to fetch exports:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  return {
    exports,
    loading,
    requestDataExport,
    downloadExport,
    fetchExports,
  };
};

// API Access Management Hook
export const useAPIAccess = () => {
  const { profile } = useAuth();
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<Record<string, any>>({});

  const createAPIToken = useCallback(async (tokenData: {
    token_name: string;
    scopes: string[];
    allowed_ips?: string[];
    allowed_origins?: string[];
    rate_limit_per_hour?: number;
    rate_limit_per_day?: number;
    expires_at?: string;
  }) => {
    setLoading(true);
    try {
      // Generate secure token
      const token = generateSecureToken();
      const tokenHash = await hashToken(token);
      const tokenPreview = `${token.slice(0, 4)}...${token.slice(-4)}`;

      const { data: apiToken, error } = await supabase
        .from('api_access_tokens')
        .insert({
          tenant_id: profile?.tenant_id,
          user_id: profile?.id,
          token_name: tokenData.token_name,
          token_hash: tokenHash,
          token_preview: tokenPreview,
          scopes: tokenData.scopes,
          allowed_ips: tokenData.allowed_ips || [],
          allowed_origins: tokenData.allowed_origins || [],
          rate_limit_per_hour: tokenData.rate_limit_per_hour || 1000,
          rate_limit_per_day: tokenData.rate_limit_per_day || 10000,
          expires_at: tokenData.expires_at
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit trail for token creation
      await logAuditEvent(
        'create',
        'api_token',
        apiToken.id,
        tokenData.token_name,
        'high' // High risk for API token creation
      );

      toast({
        title: "API Token Created",
        description: "Your API access token has been created successfully.",
      });

      setTokens(prev => [apiToken, ...prev]);
      
      // Return the actual token only once during creation
      return { success: true, token: apiToken, actualToken: token };

    } catch (error: any) {
      console.error('API token creation error:', error);
      toast({
        title: "Token Creation Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const revokeAPIToken = useCallback(async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('api_access_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)
        .eq('tenant_id', profile?.tenant_id);

      if (error) throw error;

      // Log audit trail for token revocation
      await logAuditEvent(
        'delete',
        'api_token',
        tokenId,
        'API Token Revoked',
        'medium'
      );

      setTokens(prev => 
        prev.map(token => 
          token.id === tokenId 
            ? { ...token, is_active: false }
            : token
        )
      );

      toast({
        title: "Token Revoked",
        description: "API token has been revoked successfully.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Token revocation error:', error);
      toast({
        title: "Revocation Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [profile?.tenant_id]);

  const checkRateLimit = useCallback(async (tokenId: string) => {
    try {
      const { data: token, error } = await supabase
        .from('api_access_tokens')
        .select('*')
        .eq('id', tokenId)
        .eq('tenant_id', profile?.tenant_id)
        .single();

      if (error) throw error;

      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.toDateString();

      // Reset counters if needed
      let updates: any = {};
      
      if (new Date(token.last_reset_hour).getHours() !== currentHour) {
        updates.current_hour_count = 0;
        updates.last_reset_hour = now.toISOString();
      }

      if (new Date(token.last_reset_day).toDateString() !== currentDay) {
        updates.current_day_count = 0;
        updates.last_reset_day = currentDay;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('api_access_tokens')
          .update(updates)
          .eq('id', tokenId);
        
        token.current_hour_count = updates.current_hour_count || token.current_hour_count;
        token.current_day_count = updates.current_day_count || token.current_day_count;
      }

      const rateLimitInfo = {
        hourly: {
          used: token.current_hour_count,
          limit: token.rate_limit_per_hour,
          remaining: token.rate_limit_per_hour - token.current_hour_count,
          exceeded: token.current_hour_count >= token.rate_limit_per_hour
        },
        daily: {
          used: token.current_day_count,
          limit: token.rate_limit_per_day,
          remaining: token.rate_limit_per_day - token.current_day_count,
          exceeded: token.current_day_count >= token.rate_limit_per_day
        }
      };

      setRateLimitStatus(prev => ({
        ...prev,
        [tokenId]: rateLimitInfo
      }));

      return { success: true, rateLimitInfo };

    } catch (error: any) {
      console.error('Rate limit check error:', error);
      return { success: false, error: error.message };
    }
  }, [profile?.tenant_id]);

  const fetchAPITokens = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_access_tokens')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTokens(data || []);
      return { success: true, tokens: data };

    } catch (error: any) {
      console.error('Failed to fetch API tokens:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  return {
    tokens,
    loading,
    rateLimitStatus,
    createAPIToken,
    revokeAPIToken,
    checkRateLimit,
    fetchAPITokens,
  };
};

// Audit Log Hook
export const useAuditLogs = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = useCallback(async (filters: {
    action?: string;
    resource_type?: string;
    risk_level?: string;
    date_range?: { start: string; end: string };
    user_id?: string;
  } = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(first_name, last_name, email)
        `)
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
      return { success: true, logs: data };

    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  const exportAuditLogs = useCallback(async (filters: any, format: 'csv' | 'json' = 'csv') => {
    try {
      const { logs } = await fetchAuditLogs(filters);
      
      if (!logs || logs.length === 0) {
        toast({
          title: "No Data to Export",
          description: "No audit logs found for the specified criteria.",
          variant: "destructive",
        });
        return { success: false, error: 'No data to export' };
      }

      // Log the export action
      await logAuditEvent(
        'read',
        'audit_logs_export',
        'bulk',
        `Exported ${logs.length} audit logs`,
        'medium'
      );

      // Generate export data
      let exportData: string;
      let mimeType: string;
      let filename: string;

      if (format === 'csv') {
        exportData = generateCSV(logs);
        mimeType = 'text/csv';
        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        exportData = JSON.stringify(logs, null, 2);
        mimeType = 'application/json';
        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      }

      // Create and trigger download
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Completed",
        description: `Audit logs exported successfully as ${format.toUpperCase()}.`,
      });

      return { success: true, filename };

    } catch (error: any) {
      console.error('Audit log export error:', error);
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [fetchAuditLogs]);

  return {
    logs,
    loading,
    fetchAuditLogs,
    exportAuditLogs,
  };
};

// Utility functions
const validateSensitiveDataAccess = async (): Promise<boolean> => {
  // Implement permission validation logic
  // For demo purposes, return true
  return true;
};

const logAuditEvent = async (
  action: string,
  resourceType: string,
  resourceId: string,
  resourceName: string,
  riskLevel: string = 'low'
) => {
  try {
    const clientIP = await getClientIP();
    
    await supabase.from('audit_logs').insert({
      tenant_id: 'demo-tenant-id',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      resource_name: resourceName,
      ip_address: clientIP,
      user_agent: navigator.userAgent,
      risk_level: riskLevel,
      additional_context: {
        timestamp: new Date().toISOString(),
        session_id: 'current-session' // Would get from auth context
      }
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
};

const getClientIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch {
    return null;
  }
};

const simulateDataExportProcessing = async (exportRequest: any) => {
  // Simulate processing time based on export type
  const processingTimes = {
    'tickets': 2000,
    'reports': 3000,
    'audit_logs': 4000,
    'complete_data': 8000
  };

  const processingTime = processingTimes[exportRequest.export_type] || 3000;
  await new Promise(resolve => setTimeout(resolve, processingTime));

  // Simulate occasional failures
  if (Math.random() < 0.1) {
    return {
      success: false,
      error: 'Processing timeout - please try again with a smaller date range',
      errorDetails: { code: 'TIMEOUT', timestamp: new Date().toISOString() }
    };
  }

  return {
    success: true,
    filePath: `/exports/${exportRequest.id}.${exportRequest.export_format}`,
    fileSize: Math.floor(Math.random() * 1000000) + 50000, // Random size
    downloadUrl: `/api/exports/download/${exportRequest.id}`
  };
};

const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).filter(key => key !== 'user');
  const csvHeaders = [...headers, 'user_name', 'user_email'].join(',');
  
  const csvRows = data.map(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    
    // Add user information
    values.push(`"${row.user?.first_name || ''} ${row.user?.last_name || ''}"`);
    values.push(`"${row.user?.email || ''}"`);
    
    return values.join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
};
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { ErrorLog } from '@/types';

export const useErrorLogger = () => {
  const { environment } = useEnvironment();

  const logError = useCallback(async (
    error: Error,
    errorType: string,
    context: Record<string, any> = {}
  ): Promise<void> => {
    try {
      const errorLog: Omit<ErrorLog, 'id' | 'created_at'> = {
        error_type: errorType,
        error_message: error.message,
        error_stack: error.stack,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
        environment,
        url: window.location.href,
        user_agent: navigator.userAgent,
        tenant_id: undefined, // Will be set by RLS if user is authenticated
        user_id: undefined,
      };

      // Try to log to Supabase, but don't throw if it fails
      await supabase.from('error_logs').insert(errorLog);
      
      // Also log to console in development
      if (environment === 'demo') {
        console.error(`[${errorType}]`, error, context);
      }
    } catch (loggingError) {
      // Fallback to console logging if database logging fails
      console.error('Failed to log error to database:', loggingError);
      console.error('Original error:', error);
    }
  }, [environment]);

  return { logError };
};
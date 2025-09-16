import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useEnvironment } from '@/contexts/EnvironmentContext';

export interface ErrorReport {
  id: string;
  errorType: 'ui' | 'network' | 'validation' | 'permission' | 'system' | 'other';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  userAction?: string;
  screenshot?: string;
  context: Record<string, any>;
  timestamp: string;
  url: string;
  userAgent: string;
}

export const useErrorReporting = () => {
  const [isReporting, setIsReporting] = useState(false);
  const { environment } = useEnvironment();

  // Capture screenshot
  const captureScreenshot = useCallback(async (): Promise<string | undefined> => {
    try {
      // Use html2canvas if available, fallback to basic info
      if (typeof window !== 'undefined' && 'html2canvas' in window) {
        const html2canvas = (window as any).html2canvas;
        const canvas = await html2canvas(document.body, {
          height: window.innerHeight,
          width: window.innerWidth,
          scrollX: 0,
          scrollY: 0
        });
        return canvas.toDataURL('image/png');
      }
    } catch (error) {
      console.warn('Screenshot capture failed:', error);
    }
    return undefined;
  }, []);

  // Submit error report
  const submitErrorReport = useCallback(async (
    error: Error | string,
    errorType: ErrorReport['errorType'] = 'other',
    severity: ErrorReport['severity'] = 'error',
    userAction?: string,
    includeScreenshot: boolean = true,
    additionalContext: Record<string, any> = {}
  ): Promise<void> => {
    setIsReporting(true);
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    
    let screenshot: string | undefined;
    if (includeScreenshot) {
      screenshot = await captureScreenshot();
    }

    const reportData: Omit<ErrorReport, 'id'> = {
      errorType,
      severity,
      message: errorMessage,
      stack: errorStack,
      userAction,
      screenshot,
      context: {
        ...additionalContext,
        environment,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        location: {
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        }
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    try {
      // Submit to error_logs table
      const { error: submitError } = await supabase
        .from('error_logs')
        .insert({
          error_type: `USER_REPORT_${errorType.toUpperCase()}`,
          error_message: errorMessage,
          error_stack: errorStack,
          context: reportData.context,
          environment,
          url: reportData.url,
          user_agent: reportData.userAgent
        });

      if (submitError) {
        throw submitError;
      }

      toast({
        title: "Report Submitted",
        description: "Thank you for reporting this issue. We'll investigate it promptly.",
      });

    } catch (submitError) {
      // Fallback to localStorage if database fails
      try {
        const reports = JSON.parse(localStorage.getItem('pending_error_reports') || '[]');
        reports.push({
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...reportData,
          failedSubmission: true,
          submitError: submitError instanceof Error ? submitError.message : 'Unknown error'
        });
        localStorage.setItem('pending_error_reports', JSON.stringify(reports));
        
        toast({
          title: "Report Saved Locally",
          description: "We'll submit your report when the connection is restored.",
          variant: "destructive",
        });
      } catch (fallbackError) {
        toast({
          title: "Report Failed",
          description: "Unable to submit or save your error report. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsReporting(false);
    }
  }, [environment, captureScreenshot]);

  // Quick error report with default settings
  const reportError = useCallback((
    error: Error | string,
    userAction?: string
  ): void => {
    submitErrorReport(error, 'system', 'error', userAction, false);
  }, [submitErrorReport]);

  // Report UI issue with screenshot
  const reportUIIssue = useCallback((
    description: string,
    userAction: string
  ): void => {
    submitErrorReport(description, 'ui', 'warning', userAction, true);
  }, [submitErrorReport]);

  // Report critical system failure
  const reportCriticalFailure = useCallback((
    error: Error,
    context: Record<string, any> = {}
  ): void => {
    submitErrorReport(error, 'system', 'critical', 'System failure occurred', true, context);
  }, [submitErrorReport]);

  return {
    submitErrorReport,
    reportError,
    reportUIIssue,
    reportCriticalFailure,
    isReporting
  };
};
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, MessageSquare, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { toast } from '@/hooks/use-toast';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  const { reportCriticalFailure, isReporting } = useErrorReporting();
  const { addRetryOperation } = useErrorRecovery();

  const handleRetry = () => {
    // Add retry operation for boundary reset
    addRetryOperation(
      `boundary_reset_${Date.now()}`,
      async () => {
        resetErrorBoundary();
        return Promise.resolve();
      },
      3,
      true
    );
  };

  const handleReportError = () => {
    reportCriticalFailure(error, {
      component: 'ErrorBoundary',
      action: 'Component crashed',
      errorBoundary: true
    });
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            Something Went Wrong
          </CardTitle>
          <CardDescription className="text-lg">
            We've encountered an unexpected error, but don't worry - we can help you recover.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Error Details:</h4>
            <p className="text-sm text-muted-foreground font-mono">
              {error.message}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={handleRetry}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={handleReportError}
              variant="outline"
              disabled={isReporting}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {isReporting ? 'Reporting...' : 'Report Issue'}
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              If the problem persists, you can:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={handleReload}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              
              <Button 
                onClick={handleGoHome}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Data Protection Active
            </h4>
            <p className="text-xs text-blue-600">
              Your work is automatically saved and will be restored when you return.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ErrorBoundaryWithRecoveryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export const ErrorBoundaryWithRecovery: React.FC<ErrorBoundaryWithRecoveryProps> = ({ 
  children, 
  onError 
}) => {
  const { reportCriticalFailure } = useErrorReporting();

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Report to our error system
    reportCriticalFailure(error, {
      errorInfo: errorInfo.componentStack,
      type: 'React Error Boundary'
    });

    // Call optional callback
    if (onError) {
      onError(error, errorInfo);
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
};
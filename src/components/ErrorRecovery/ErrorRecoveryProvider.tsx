import React, { createContext, useContext, useState } from 'react';
import { ErrorBoundaryWithRecovery } from './ErrorBoundaryWithRecovery';
import { ErrorFeedbackPanel } from './ErrorFeedbackPanel';
import { DemoModeBanner } from '../Environment/DemoModeBanner';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useEnvironment } from '@/contexts/EnvironmentContext';

interface ErrorRecoveryContextType {
  // Error Recovery
  addRetryOperation: ReturnType<typeof useErrorRecovery>['addRetryOperation'];
  manualRetry: ReturnType<typeof useErrorRecovery>['manualRetry'];
  getFailedOperations: ReturnType<typeof useErrorRecovery>['getFailedOperations'];
  
  // Error Reporting
  reportError: ReturnType<typeof useErrorReporting>['reportError'];
  reportUIIssue: ReturnType<typeof useErrorReporting>['reportUIIssue'];
  reportCriticalFailure: ReturnType<typeof useErrorReporting>['reportCriticalFailure'];
  showErrorFeedback: (error?: Error | string, context?: Record<string, any>) => void;
  
  // Session Management
  sessionTimeRemaining: number | null;
  extendSession: ReturnType<typeof useSessionTimeout>['extendSession'];
  isSessionWarningShown: boolean;
  
  // Undo/Redo
  undo: ReturnType<typeof useUndoRedo>['undo'];
  redo: ReturnType<typeof useUndoRedo>['redo'];
  addUndoAction: ReturnType<typeof useUndoRedo>['addAction'];
  canUndo: boolean;
  canRedo: boolean;
  
  // State
  isProcessingRecovery: boolean;
  isReporting: boolean;
}

const ErrorRecoveryContext = createContext<ErrorRecoveryContextType | undefined>(undefined);

export const useErrorRecoveryContext = () => {
  const context = useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error('useErrorRecoveryContext must be used within ErrorRecoveryProvider');
  }
  return context;
};

interface ErrorRecoveryProviderProps {
  children: React.ReactNode;
}

export const ErrorRecoveryProvider: React.FC<ErrorRecoveryProviderProps> = ({ children }) => {
  const { environment } = useEnvironment();
  const [feedbackPanel, setFeedbackPanel] = useState<{
    isOpen: boolean;
    error?: Error | string;
    context?: Record<string, any>;
  }>({ isOpen: false });

  // Initialize hooks
  const errorRecovery = useErrorRecovery();
  const errorReporting = useErrorReporting();
  const sessionTimeout = useSessionTimeout({
    enabled: environment === 'production', // Only enable in production
    timeoutDuration: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000 // 5 minutes warning
  });
  const undoRedo = useUndoRedo(100); // Keep 100 actions in history

  // Show error feedback panel
  const showErrorFeedback = (error?: Error | string, context?: Record<string, any>) => {
    setFeedbackPanel({
      isOpen: true,
      error,
      context
    });
  };

  // Close feedback panel
  const closeFeedbackPanel = () => {
    setFeedbackPanel({ isOpen: false });
  };

  const value: ErrorRecoveryContextType = {
    // Error Recovery
    addRetryOperation: errorRecovery.addRetryOperation,
    manualRetry: errorRecovery.manualRetry,
    getFailedOperations: errorRecovery.getFailedOperations,
    
    // Error Reporting
    reportError: errorReporting.reportError,
    reportUIIssue: errorReporting.reportUIIssue,
    reportCriticalFailure: errorReporting.reportCriticalFailure,
    showErrorFeedback,
    
    // Session Management
    sessionTimeRemaining: sessionTimeout.timeRemaining,
    extendSession: sessionTimeout.extendSession,
    isSessionWarningShown: sessionTimeout.isWarningShown,
    
    // Undo/Redo
    undo: undoRedo.undo,
    redo: undoRedo.redo,
    addUndoAction: undoRedo.addAction,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
    
    // State
    isProcessingRecovery: errorRecovery.isProcessing,
    isReporting: errorReporting.isReporting
  };

  return (
    <ErrorRecoveryContext.Provider value={value}>
      <ErrorBoundaryWithRecovery>
        <DemoModeBanner />
        {children}
        
        <ErrorFeedbackPanel
          isOpen={feedbackPanel.isOpen}
          onClose={closeFeedbackPanel}
          initialError={feedbackPanel.error}
          initialContext={feedbackPanel.context}
        />
      </ErrorBoundaryWithRecovery>
    </ErrorRecoveryContext.Provider>
  );
};
import { useCallback, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface RetryOperation {
  id: string;
  operation: () => Promise<any>;
  maxRetries: number;
  currentRetries: number;
  lastError?: Error;
  status: 'pending' | 'retrying' | 'failed' | 'success';
  exponentialBackoff: boolean;
}

export interface ErrorRecoveryState {
  operations: RetryOperation[];
  queue: string[];
  isProcessing: boolean;
}

export const useErrorRecovery = () => {
  const [state, setState] = useState<ErrorRecoveryState>({
    operations: [],
    queue: [],
    isProcessing: false
  });

  // Exponential backoff calculation
  const calculateDelay = useCallback((retryCount: number): number => {
    return Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
  }, []);

  // Add operation to recovery queue
  const addRetryOperation = useCallback(
    (
      id: string,
      operation: () => Promise<any>,
      maxRetries: number = 3,
      exponentialBackoff: boolean = true
    ): string => {
      const retryOp: RetryOperation = {
        id,
        operation,
        maxRetries,
        currentRetries: 0,
        status: 'pending',
        exponentialBackoff
      };

      setState(prev => ({
        ...prev,
        operations: [...prev.operations.filter(op => op.id !== id), retryOp],
        queue: [...prev.queue.filter(opId => opId !== id), id]
      }));

      return id;
    }, []
  );

  // Process retry queue
  const processQueue = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isProcessing: true }));

    while (state.queue.length > 0) {
      const operationId = state.queue[0];
      const operation = state.operations.find(op => op.id === operationId);

      if (!operation || operation.status === 'success') {
        setState(prev => ({
          ...prev,
          queue: prev.queue.filter(id => id !== operationId)
        }));
        continue;
      }

      try {
        setState(prev => ({
          ...prev,
          operations: prev.operations.map(op =>
            op.id === operationId ? { ...op, status: 'retrying' as const } : op
          )
        }));

        await operation.operation();

        setState(prev => ({
          ...prev,
          operations: prev.operations.map(op =>
            op.id === operationId ? { ...op, status: 'success' as const } : op
          ),
          queue: prev.queue.filter(id => id !== operationId)
        }));

        toast({
          title: "Operation Recovered",
          description: "Failed operation completed successfully",
        });

      } catch (error) {
        const updatedOp = { ...operation };
        updatedOp.currentRetries++;
        updatedOp.lastError = error as Error;

        if (updatedOp.currentRetries >= updatedOp.maxRetries) {
          updatedOp.status = 'failed';
          setState(prev => ({
            ...prev,
            operations: prev.operations.map(op =>
              op.id === operationId ? updatedOp : op
            ),
            queue: prev.queue.filter(id => id !== operationId)
          }));

          toast({
            title: "Operation Failed",
            description: `Failed after ${updatedOp.maxRetries} attempts: ${error.message}`,
            variant: "destructive",
          });
        } else {
          updatedOp.status = 'pending';
          setState(prev => ({
            ...prev,
            operations: prev.operations.map(op =>
              op.id === operationId ? updatedOp : op
            )
          }));

          // Wait for exponential backoff
          if (operation.exponentialBackoff) {
            await new Promise(resolve => 
              setTimeout(resolve, calculateDelay(updatedOp.currentRetries))
            );
          }
        }
      }
    }

    setState(prev => ({ ...prev, isProcessing: false }));
  }, [state.queue, state.operations, calculateDelay]);

  // Manual retry for failed operations
  const manualRetry = useCallback((operationId: string): void => {
    setState(prev => {
      const operation = prev.operations.find(op => op.id === operationId);
      if (operation && operation.status === 'failed') {
        return {
          ...prev,
          operations: prev.operations.map(op =>
            op.id === operationId 
              ? { ...op, status: 'pending', currentRetries: 0 }
              : op
          ),
          queue: [...prev.queue, operationId]
        };
      }
      return prev;
    });
  }, []);

  // Get failed operations for manual retry
  const getFailedOperations = useCallback((): RetryOperation[] => {
    return state.operations.filter(op => op.status === 'failed');
  }, [state.operations]);

  // Clear completed operations
  const clearCompleted = useCallback((): void => {
    setState(prev => ({
      ...prev,
      operations: prev.operations.filter(op => 
        op.status !== 'success' && op.status !== 'failed'
      )
    }));
  }, []);

  // Auto-process queue when new operations are added
  useEffect(() => {
    if (state.queue.length > 0 && !state.isProcessing) {
      processQueue();
    }
  }, [state.queue.length, state.isProcessing, processQueue]);

  return {
    addRetryOperation,
    manualRetry,
    getFailedOperations,
    clearCompleted,
    isProcessing: state.isProcessing,
    queueLength: state.queue.length,
    operations: state.operations
  };
};
import { useCallback, useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export interface UndoRedoAction<T = any> {
  id: string;
  timestamp: number;
  description: string;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
  data?: T;
}

interface UndoRedoState {
  undoStack: UndoRedoAction[];
  redoStack: UndoRedoAction[];
  currentIndex: number;
  maxHistorySize: number;
}

export const useUndoRedo = (maxHistorySize: number = 50) => {
  const [state, setState] = useState<UndoRedoState>({
    undoStack: [],
    redoStack: [],
    currentIndex: -1,
    maxHistorySize
  });

  const isProcessingRef = useRef(false);

  // Add a new action to the history
  const addAction = useCallback((
    description: string,
    undoFn: () => Promise<void> | void,
    redoFn: () => Promise<void> | void,
    data?: any
  ): string => {
    if (isProcessingRef.current) return '';

    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const action: UndoRedoAction = {
      id: actionId,
      timestamp: Date.now(),
      description,
      undo: undoFn,
      redo: redoFn,
      data
    };

    setState(prev => {
      const newUndoStack = [
        ...prev.undoStack.slice(0, prev.currentIndex + 1),
        action
      ];

      // Limit history size
      const startIndex = Math.max(0, newUndoStack.length - prev.maxHistorySize);
      const trimmedStack = newUndoStack.slice(startIndex);

      return {
        ...prev,
        undoStack: trimmedStack,
        redoStack: [], // Clear redo stack when new action is added
        currentIndex: trimmedStack.length - 1
      };
    });

    return actionId;
  }, []);

  // Undo the last action
  const undo = useCallback(async (): Promise<boolean> => {
    if (isProcessingRef.current || state.currentIndex < 0) return false;

    const action = state.undoStack[state.currentIndex];
    if (!action) return false;

    try {
      isProcessingRef.current = true;
      
      await action.undo();
      
      setState(prev => ({
        ...prev,
        redoStack: [action, ...prev.redoStack],
        currentIndex: prev.currentIndex - 1
      }));

      toast({
        title: "Action Undone",
        description: `Undone: ${action.description}`,
      });

      return true;
    } catch (error) {
      toast({
        title: "Undo Failed",
        description: `Failed to undo: ${action.description}`,
        variant: "destructive",
      });
      return false;
    } finally {
      isProcessingRef.current = false;
    }
  }, [state.undoStack, state.currentIndex]);

  // Redo the next action
  const redo = useCallback(async (): Promise<boolean> => {
    if (isProcessingRef.current || state.redoStack.length === 0) return false;

    const action = state.redoStack[0];
    if (!action) return false;

    try {
      isProcessingRef.current = true;
      
      await action.redo();
      
      setState(prev => ({
        ...prev,
        undoStack: [...prev.undoStack, action],
        redoStack: prev.redoStack.slice(1),
        currentIndex: prev.currentIndex + 1
      }));

      toast({
        title: "Action Redone",
        description: `Redone: ${action.description}`,
      });

      return true;
    } catch (error) {
      toast({
        title: "Redo Failed",
        description: `Failed to redo: ${action.description}`,
        variant: "destructive",
      });
      return false;
    } finally {
      isProcessingRef.current = false;
    }
  }, [state.redoStack]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      undoStack: [],
      redoStack: [],
      currentIndex: -1
    }));

    toast({
      title: "History Cleared",
      description: "All undo/redo history has been cleared",
    });
  }, []);

  // Get action history for display
  const getHistory = useCallback(() => {
    return {
      undoActions: state.undoStack.map((action, index) => ({
        ...action,
        isCurrent: index === state.currentIndex,
        canUndo: index <= state.currentIndex
      })),
      redoActions: state.redoStack
    };
  }, [state.undoStack, state.redoStack, state.currentIndex]);

  // Batch multiple actions into a single undoable action
  const batch = useCallback((
    description: string,
    actions: Array<{
      description: string;
      action: () => Promise<void> | void;
      undo: () => Promise<void> | void;
    }>
  ): string => {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const executeActions = async () => {
      for (const action of actions) {
        await action.action();
      }
    };

    const undoActions = async () => {
      // Undo in reverse order
      for (let i = actions.length - 1; i >= 0; i--) {
        await actions[i].undo();
      }
    };

    return addAction(description, undoActions, executeActions, {
      batchId,
      actionCount: actions.length,
      actions: actions.map(a => a.description)
    });
  }, [addAction]);

  return {
    addAction,
    undo,
    redo,
    batch,
    clearHistory,
    getHistory,
    canUndo: state.currentIndex >= 0,
    canRedo: state.redoStack.length > 0,
    historySize: state.undoStack.length,
    isProcessing: isProcessingRef.current,
    undoDescription: state.currentIndex >= 0 ? state.undoStack[state.currentIndex]?.description : null,
    redoDescription: state.redoStack.length > 0 ? state.redoStack[0]?.description : null
  };
};
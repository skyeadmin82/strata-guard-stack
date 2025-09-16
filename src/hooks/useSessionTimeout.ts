import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoSave } from '@/hooks/useAutoSave';
import { toast } from '@/hooks/use-toast';

interface SessionTimeoutConfig {
  warningTime: number; // milliseconds before timeout to show warning
  timeoutDuration: number; // milliseconds of inactivity before timeout
  enabled: boolean;
}

interface SessionTimeoutState {
  timeRemaining: number;
  isWarningShown: boolean;
  isTimedOut: boolean;
}

const DEFAULT_CONFIG: SessionTimeoutConfig = {
  warningTime: 5 * 60 * 1000, // 5 minutes warning
  timeoutDuration: 30 * 60 * 1000, // 30 minutes timeout
  enabled: true
};

export const useSessionTimeout = (config: Partial<SessionTimeoutConfig> = {}) => {
  const { user, signOut } = useAuth();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<SessionTimeoutState>({
    timeRemaining: finalConfig.timeoutDuration,
    isWarningShown: false,
    isTimedOut: false
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Auto-save hook for preserving data during timeout
  const { forceSave } = useAutoSave({
    key: 'session_timeout_backup',
    data: { timestamp: Date.now() },
    enabled: true,
    onSave: async (data) => {
      // Save current form data or important state
      localStorage.setItem('session_backup_timestamp', data.timestamp.toString());
    }
  });

  // Reset timeout on activity
  const resetTimeout = useCallback(() => {
    if (!finalConfig.enabled || !user) return;

    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Reset state
    setState({
      timeRemaining: finalConfig.timeoutDuration,
      isWarningShown: false,
      isTimedOut: false
    });

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isWarningShown: true }));
      
      toast({
        title: "Session Expiring Soon",
        description: "Your session will expire in 5 minutes due to inactivity",
        variant: "destructive",
      });

      // Start countdown for timeout
      timeoutRef.current = setTimeout(() => {
        handleTimeout();
      }, finalConfig.warningTime);

    }, finalConfig.timeoutDuration - finalConfig.warningTime);

  }, [finalConfig, user]);

  // Handle session timeout
  const handleTimeout = useCallback(async () => {
    setState(prev => ({ ...prev, isTimedOut: true }));
    
    // Force save any pending data
    await forceSave();
    
    toast({
      title: "Session Expired",
      description: "You've been signed out due to inactivity. Your work has been auto-saved.",
      variant: "destructive",
    });

    // Sign out user
    await signOut();
    
  }, [forceSave, signOut]);

  // Extend session (called when user wants to continue)
  const extendSession = useCallback(() => {
    resetTimeout();
    
    toast({
      title: "Session Extended",
      description: "Your session has been extended",
    });
  }, [resetTimeout]);

  // Get countdown for UI display
  const getTimeRemaining = useCallback(() => {
    if (!state.isWarningShown) return null;
    
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = Math.max(0, finalConfig.timeoutDuration - elapsed);
    
    return Math.floor(remaining / 1000); // seconds
  }, [state.isWarningShown, finalConfig.timeoutDuration]);

  // Activity tracking
  const trackActivity = useCallback(() => {
    if (state.isTimedOut) return;
    resetTimeout();
  }, [state.isTimedOut, resetTimeout]);

  // Set up activity listeners
  useEffect(() => {
    if (!finalConfig.enabled || !user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    // Initial timeout setup
    resetTimeout();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [finalConfig.enabled, user, trackActivity, resetTimeout]);

  // Countdown update effect
  useEffect(() => {
    if (!state.isWarningShown) return;

    const interval = setInterval(() => {
      setState(prev => {
        const timeRemaining = getTimeRemaining();
        return {
          ...prev,
          timeRemaining: timeRemaining || 0
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isWarningShown, getTimeRemaining]);

  return {
    ...state,
    timeRemaining: getTimeRemaining(),
    extendSession,
    isEnabled: finalConfig.enabled && !!user
  };
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Environment } from '@/types';
import { toast } from '@/hooks/use-toast';

interface EnvironmentContextType {
  environment: Environment;
  isDemo: boolean;
  switchEnvironment: (env: Environment) => Promise<void>;
  isOnline: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};

interface EnvironmentProviderProps {
  children: React.ReactNode;
}

export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({ children }) => {
  const [environment, setEnvironment] = useState<Environment>('demo');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Load saved environment preference
    const savedEnv = localStorage.getItem('msp-environment') as Environment;
    if (savedEnv && ['demo', 'production'].includes(savedEnv)) {
      setEnvironment(savedEnv);
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const switchEnvironment = async (env: Environment): Promise<void> => {
    try {
      // Simulate environment switch validation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setEnvironment(env);
      localStorage.setItem('msp-environment', env);
      
      toast({
        title: "Environment Switched",
        description: `Successfully switched to ${env} environment`,
      });
    } catch (error) {
      toast({
        title: "Environment Switch Failed",
        description: "Failed to switch environment. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    environment,
    isDemo: environment === 'demo',
    switchEnvironment,
    isOnline,
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};
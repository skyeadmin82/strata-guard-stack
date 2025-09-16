import React from 'react';
import { useEnvironment } from '@/contexts/EnvironmentContext';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export const EnvironmentBanner: React.FC = () => {
  const { environment, isDemo, isOnline } = useEnvironment();

  if (!isDemo && isOnline) return null;

  return (
    <div className={cn(
      "w-full py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2",
      isDemo ? "bg-demo text-white" : "bg-production text-white",
      !isOnline && "bg-destructive"
    )}>
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          You are currently offline
        </>
      ) : (
        <>
          <div className={cn(
            "w-2 h-2 rounded-full",
            isDemo ? "bg-white" : "bg-white"
          )} />
          {environment.toUpperCase()} Environment
        </>
      )}
    </div>
  );
};
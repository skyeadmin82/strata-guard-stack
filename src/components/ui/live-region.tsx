import React from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  children: React.ReactNode;
  level?: 'polite' | 'assertive';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ 
  children, 
  level = 'polite', 
  className 
}) => {
  return (
    <div
      aria-live={level}
      aria-atomic="true"
      className={cn("sr-only", className)}
      role="status"
    >
      {children}
    </div>
  );
};

export const VisibleLiveRegion: React.FC<LiveRegionProps> = ({ 
  children, 
  level = 'polite', 
  className 
}) => {
  return (
    <div
      aria-live={level}
      aria-atomic="true"
      className={cn("text-sm text-muted-foreground", className)}
      role="status"
    >
      {children}
    </div>
  );
};
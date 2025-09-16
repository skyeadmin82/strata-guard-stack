import React from 'react';
import { cn } from '@/lib/utils';

interface SkipToContentProps {
  href?: string;
  className?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({ 
  href = "#main-content", 
  className 
}) => {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md",
        "font-medium text-sm transition-all duration-200",
        "focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "hover:bg-primary/90",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          // Focus the target element if it's focusable
          if (target instanceof HTMLElement) {
            target.focus();
          }
        }
      }}
    >
      Skip to main content
    </a>
  );
};
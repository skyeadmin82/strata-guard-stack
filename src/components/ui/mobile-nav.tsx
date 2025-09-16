import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './button';
import { Sheet, SheetContent, SheetTrigger } from './sheet';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ children, className }) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("md:hidden", className)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold">Navigation</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto h-full">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Mobile-optimized form wrapper
interface MobileFormProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileForm: React.FC<MobileFormProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "space-y-4",
      // Mobile optimizations
      "touch-manipulation", // Optimizes touch interactions
      "[&_input]:text-base", // Prevents zoom on iOS
      "[&_select]:text-base",
      "[&_textarea]:text-base",
      // Larger touch targets on mobile
      "[&_button]:min-h-[44px] sm:[&_button]:min-h-auto",
      "[&_input]:min-h-[44px] sm:[&_input]:min-h-auto",
      className
    )}>
      {children}
    </div>
  );
};

// Mobile-optimized table wrapper
interface MobileTableProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileTable: React.FC<MobileTableProps> = ({ children, className }) => {
  return (
    <div className={cn(
      // Hide table on mobile, show cards instead
      "hidden md:block",
      className
    )}>
      {children}
    </div>
  );
};

// Mobile card view for table data
interface MobileCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export function MobileCardList<T>({ 
  items, 
  renderCard, 
  className 
}: MobileCardListProps<T>) {
  return (
    <div className={cn(
      "block md:hidden space-y-3",
      className
    )}>
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 bg-card">
          {renderCard(item, index)}
        </div>
      ))}
    </div>
  );
}

// Hook for mobile detection
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return isMobile;
};

// Mobile-optimized dialog/modal
interface MobileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const MobileDialog: React.FC<MobileDialogProps> = ({
  open,
  onOpenChange,
  children,
  className
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className={cn("h-[90vh]", className)}>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  // Return regular dialog for desktop
  return (
    <div className={className}>
      {children}
    </div>
  );
};
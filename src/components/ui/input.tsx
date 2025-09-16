import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // ✅ ACCESSIBILITY: Enhanced with proper ARIA attributes
    const hasError = props['aria-invalid'] === 'true' || props['aria-describedby']?.includes('error');
    const isRequired = props.required || props['aria-required'] === 'true';
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-background px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm enterprise-input transition-all duration-200 focus:shadow-md",
          hasError && "border-destructive focus-visible:ring-destructive",
          className,
        )}
        ref={ref}
        aria-required={isRequired}
        aria-invalid={hasError}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

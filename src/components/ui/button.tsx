import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 enterprise-button",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-subtle hover:shadow-subtle-md hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-subtle hover:shadow-subtle-md",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-subtle hover:shadow-subtle-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-subtle hover:shadow-subtle-md",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-all duration-fast",
        link: "text-primary underline-offset-4 hover:underline transition-all duration-fast",
        enterprise: "bg-enterprise-primary text-white hover:bg-enterprise-primary-dark shadow-subtle-md hover:shadow-subtle-lg hover:-translate-y-0.5 transition-all duration-normal",
      },
      size: {
        default: "h-10 px-comfortable py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-spacious text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

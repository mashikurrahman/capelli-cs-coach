import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-capelli-navy text-white shadow-sm hover:-translate-y-0.5 hover:bg-capelli-navyDark hover:shadow-md',
        destructive: 'bg-capelli-danger text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md',
        outline: 'border border-slate-200 bg-white/80 text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md',
        secondary: 'bg-slate-100 text-slate-900 shadow-sm hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-md',
        ghost: 'text-slate-700 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900',
        link: 'text-capelli-navy underline-offset-4 hover:underline',
        success: 'bg-capelli-success text-white shadow-sm hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md',
        warning: 'bg-capelli-warning text-white shadow-sm hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-md',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        xl: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

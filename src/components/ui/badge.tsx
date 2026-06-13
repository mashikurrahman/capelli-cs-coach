import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-capelli-navy text-white shadow-sm',
        secondary: 'border-slate-200 bg-slate-100 text-slate-900',
        success: 'border-green-200/70 bg-capelli-successBg text-capelli-success',
        warning: 'border-yellow-200/70 bg-capelli-warningBg text-capelli-warning',
        danger: 'border-red-200/70 bg-capelli-dangerBg text-capelli-danger',
        info: 'border-blue-200/70 bg-capelli-infoBg text-capelli-info',
        purple: 'border-purple-200/70 bg-capelli-purpleBg text-capelli-purple',
        outline: 'border-current bg-transparent',
        draft: 'border-slate-200 bg-slate-100 text-slate-600',
        approved: 'border-green-200/70 bg-capelli-successBg text-capelli-success',
        archived: 'border-slate-200 bg-slate-100 text-slate-500',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

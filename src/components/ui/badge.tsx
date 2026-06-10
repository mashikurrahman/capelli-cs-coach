import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-capelli-navy text-white',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-capelli-successBg text-capelli-success',
        warning: 'bg-capelli-warningBg text-capelli-warning',
        danger: 'bg-capelli-dangerBg text-capelli-danger',
        info: 'bg-capelli-infoBg text-capelli-info',
        purple: 'bg-capelli-purpleBg text-capelli-purple',
        outline: 'border border-current',
        draft: 'bg-gray-100 text-gray-600',
        approved: 'bg-capelli-successBg text-capelli-success',
        archived: 'bg-gray-100 text-gray-500',
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

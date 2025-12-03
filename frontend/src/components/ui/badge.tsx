'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--neutral-200)] text-[var(--neutral-700)]',
      primary: 'bg-[var(--primary-100)] text-[var(--primary-700)]',
      secondary: 'bg-[var(--secondary-100)] text-[var(--secondary-800)]',
      success: 'bg-[var(--success-light)] text-green-700',
      warning: 'bg-[var(--warning-light)] text-amber-700',
      error: 'bg-[var(--error-light)] text-red-700',
      info: 'bg-[var(--info-light)] text-blue-700',
    };

    const sizes = {
      sm: 'px-1.5 py-0.5 text-xs',
      md: 'px-2 py-0.5 text-xs',
      lg: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              variant === 'success' && 'bg-green-500',
              variant === 'warning' && 'bg-amber-500',
              variant === 'error' && 'bg-red-500',
              variant === 'info' && 'bg-blue-500',
              variant === 'primary' && 'bg-[var(--primary-500)]',
              variant === 'secondary' && 'bg-[var(--secondary-500)]',
              variant === 'default' && 'bg-[var(--neutral-500)]'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };


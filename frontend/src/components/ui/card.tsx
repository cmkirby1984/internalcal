'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   CARD
   ───────────────────────────────────────────────────────────────────────────── */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hoverable = false, ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--bg-card)] shadow-[var(--shadow-card)]',
      elevated: 'bg-[var(--bg-card)] shadow-[var(--shadow-lg)]',
      outline: 'bg-[var(--bg-card)] border border-[var(--border-light)]',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200',
          variants[variant],
          paddings[padding],
          hoverable && 'cursor-pointer hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

/* ─────────────────────────────────────────────────────────────────────────────
   CARD HEADER
   ───────────────────────────────────────────────────────────────────────────── */

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between pb-4 border-b border-[var(--border-light)]',
        className
      )}
      {...props}
    >
      {children || (
        <>
          <div>
            {title && <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>}
            {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </>
      )}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

/* ─────────────────────────────────────────────────────────────────────────────
   CARD CONTENT
   ───────────────────────────────────────────────────────────────────────────── */

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('py-4', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

/* ─────────────────────────────────────────────────────────────────────────────
   CARD FOOTER
   ───────────────────────────────────────────────────────────────────────────── */

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'pt-4 border-t border-[var(--border-light)] text-sm text-[var(--text-secondary)]',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };


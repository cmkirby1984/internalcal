'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  onClick,
  className,
}: StatCardProps) {
  const colorStyles = {
    primary: {
      iconBg: 'bg-[var(--primary-100)]',
      iconColor: 'text-[var(--primary-600)]',
    },
    success: {
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    error: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  };

  const styles = colorStyles[color];

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={cn('relative overflow-hidden', className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{title}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
          
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <svg
                className={cn(
                  'w-4 h-4',
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600 rotate-180'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-xs text-[var(--text-muted)]">vs last week</span>
            </div>
          )}
        </div>
        
        <div className={cn('p-3 rounded-xl', styles.iconBg, styles.iconColor)}>
          {icon}
        </div>
      </div>

      {/* Decorative element */}
      <div
        className={cn(
          'absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10',
          color === 'primary' && 'bg-[var(--primary-500)]',
          color === 'success' && 'bg-emerald-500',
          color === 'warning' && 'bg-amber-500',
          color === 'error' && 'bg-red-500',
          color === 'info' && 'bg-blue-500'
        )}
      />
    </Card>
  );
}


'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { SuiteStatus } from '@/lib/types';

interface SuiteStatusChartProps {
  stats: {
    vacantClean: number;
    vacantDirty: number;
    occupiedClean: number;
    occupiedDirty: number;
    outOfOrder: number;
    blocked: number;
  };
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  vacantClean: { label: 'Vacant Clean', color: 'bg-emerald-500', bgColor: 'bg-emerald-100' },
  vacantDirty: { label: 'Vacant Dirty', color: 'bg-amber-500', bgColor: 'bg-amber-100' },
  occupiedClean: { label: 'Occupied Clean', color: 'bg-blue-500', bgColor: 'bg-blue-100' },
  occupiedDirty: { label: 'Occupied Dirty', color: 'bg-orange-500', bgColor: 'bg-orange-100' },
  outOfOrder: { label: 'Out of Order', color: 'bg-red-500', bgColor: 'bg-red-100' },
  blocked: { label: 'Blocked', color: 'bg-gray-500', bgColor: 'bg-gray-100' },
};

export function SuiteStatusChart({ stats, className }: SuiteStatusChartProps) {
  const total = useMemo(() => {
    return Object.values(stats).reduce((sum, val) => sum + val, 0);
  }, [stats]);

  const segments = useMemo(() => {
    const entries = Object.entries(stats).filter(([_, value]) => value > 0);
    let accumulatedPercent = 0;
    
    return entries.map(([key, value]) => {
      const percent = (value / total) * 100;
      const config = statusConfig[key] || { label: key, color: 'bg-gray-400', bgColor: 'bg-gray-100' };
      const segment = {
        key,
        value,
        percent,
        offset: accumulatedPercent,
        ...config,
      };
      accumulatedPercent += percent;
      return segment;
    });
  }, [stats, total]);

  return (
    <div className={cn('', className)}>
      {/* Donut Chart */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((segment, index) => {
            const circumference = 2 * Math.PI * 40;
            const strokeDasharray = `${(segment.percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -(segment.offset / 100) * circumference;
            
            return (
              <circle
                key={segment.key}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="12"
                className={segment.color.replace('bg-', 'stroke-')}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[var(--text-primary)]">{total}</span>
          <span className="text-sm text-[var(--text-secondary)]">Total Suites</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', segment.color)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {segment.label}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {segment.value} ({segment.percent.toFixed(0)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


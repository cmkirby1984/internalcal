'use client';

import { cn, formatRelativeTime } from '@/lib/utils';
import { Card, SuiteStatusBadge, Badge, Avatar } from '@/components/ui';
import { UISuite, SuiteStatus, SuiteType } from '@/lib/types';

interface SuiteCardProps {
  suite: UISuite;
  onClick?: () => void;
  onStatusChange?: (status: SuiteStatus) => void;
  compact?: boolean;
  className?: string;
}

const suiteTypeLabels: Record<SuiteType, string> = {
  [SuiteType.STANDARD]: 'Standard',
  [SuiteType.DELUXE]: 'Deluxe',
  [SuiteType.SUITE]: 'Suite',
  [SuiteType.ACCESSIBLE]: 'Accessible',
};

export function SuiteCard({
  suite,
  onClick,
  onStatusChange,
  compact = false,
  className,
}: SuiteCardProps) {
  const needsAttention = 
    suite.status === SuiteStatus.VACANT_DIRTY ||
    suite.status === SuiteStatus.OCCUPIED_DIRTY ||
    suite.status === SuiteStatus.OUT_OF_ORDER;

  const statusColorMap: Record<SuiteStatus, string> = {
    [SuiteStatus.VACANT_CLEAN]: 'border-l-emerald-500',
    [SuiteStatus.VACANT_DIRTY]: 'border-l-amber-500',
    [SuiteStatus.OCCUPIED_CLEAN]: 'border-l-blue-500',
    [SuiteStatus.OCCUPIED_DIRTY]: 'border-l-orange-500',
    [SuiteStatus.OUT_OF_ORDER]: 'border-l-red-500',
    [SuiteStatus.BLOCKED]: 'border-l-gray-500',
  };

  return (
    <Card
      hoverable
      onClick={onClick}
      className={cn(
        'border-l-4 transition-all',
        statusColorMap[suite.status],
        needsAttention && 'ring-2 ring-amber-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            {suite.suiteNumber}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Floor {suite.floor} • {suiteTypeLabels[suite.type]}
          </p>
        </div>
        <SuiteStatusBadge status={suite.status} />
      </div>

      {/* Info */}
      {!compact && (
        <div className="space-y-2 mb-3">
          {/* Bed Configuration */}
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{suite.bedConfiguration}</span>
          </div>

          {/* Current Guest */}
          {suite.currentGuest?.name && (
            <div className="flex items-center gap-2 text-sm">
              <Avatar name={suite.currentGuest.name} size="xs" />
              <span className="text-[var(--text-primary)]">{suite.currentGuest.name}</span>
              {suite.currentGuest.checkOut && (
                <span className="text-[var(--text-muted)]">
                  • Out: {new Date(suite.currentGuest.checkOut).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {/* Active Tasks */}
          {suite.activeTasks && suite.activeTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                {suite.activeTasks.length} active task{suite.activeTasks.length > 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-[var(--border-light)] flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">
          {suite.lastCleaned 
            ? `Cleaned ${formatRelativeTime(suite.lastCleaned)}`
            : 'Never cleaned'
          }
        </span>
        
        {needsAttention && (
          <Badge variant="warning" size="sm">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Attention
          </Badge>
        )}
      </div>
    </Card>
  );
}


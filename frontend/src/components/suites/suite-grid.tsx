'use client';

import { cn } from '@/lib/utils';
import { UISuite, SuiteStatus } from '@/lib/types';
import { SuiteCard } from './suite-card';
import { NoSuitesFound, SkeletonCard } from '@/components/ui';

interface SuiteGridProps {
  suites: UISuite[];
  isLoading?: boolean;
  onSuiteClick?: (suite: UISuite) => void;
  onStatusChange?: (suiteId: string, status: SuiteStatus) => void;
  onCreateSuite?: () => void;
  className?: string;
}

export function SuiteGrid({
  suites,
  isLoading = false,
  onSuiteClick,
  onStatusChange,
  onCreateSuite,
  className,
}: SuiteGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (suites.length === 0) {
    return <NoSuitesFound onCreateSuite={onCreateSuite} />;
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
      {suites.map((suite) => (
        <SuiteCard
          key={suite.id}
          suite={suite}
          onClick={() => onSuiteClick?.(suite)}
          onStatusChange={(status) => onStatusChange?.(suite.id, status)}
        />
      ))}
    </div>
  );
}


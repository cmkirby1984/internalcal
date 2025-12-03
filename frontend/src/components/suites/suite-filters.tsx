'use client';

import { cn, formatEnumValue } from '@/lib/utils';
import { Button, Select } from '@/components/ui';
import { SuiteStatus, SuiteType } from '@/lib/types';

interface SuiteFiltersProps {
  filters: {
    status?: SuiteStatus[];
    floor?: number[];
    type?: SuiteType[];
    needsCleaning?: boolean;
  };
  onFilterChange: (key: string, value: unknown) => void;
  onClearFilters: () => void;
  className?: string;
}

const statusOptions = Object.values(SuiteStatus).map((status) => ({
  value: status,
  label: formatEnumValue(status),
}));

const typeOptions = Object.values(SuiteType).map((type) => ({
  value: type,
  label: formatEnumValue(type),
}));

const floorOptions = [1, 2, 3, 4].map((floor) => ({
  value: String(floor),
  label: `Floor ${floor}`,
}));

export function SuiteFilters({
  filters,
  onFilterChange,
  onClearFilters,
  className,
}: SuiteFiltersProps) {
  const hasActiveFilters = 
    (filters.status && filters.status.length > 0) ||
    (filters.floor && filters.floor.length > 0) ||
    (filters.type && filters.type.length > 0) ||
    filters.needsCleaning;

  return (
    <div className={cn('bg-[var(--bg-card)] rounded-xl p-4 shadow-[var(--shadow-card)]', className)}>
      <div className="flex flex-wrap items-end gap-4">
        {/* Status Filter */}
        <div className="w-48">
          <Select
            label="Status"
            placeholder="All statuses"
            options={statusOptions}
            value={filters.status?.[0] || ''}
            onChange={(value) => onFilterChange('status', value ? [value] : [])}
          />
        </div>

        {/* Floor Filter */}
        <div className="w-36">
          <Select
            label="Floor"
            placeholder="All floors"
            options={floorOptions}
            value={filters.floor?.[0]?.toString() || ''}
            onChange={(value) => onFilterChange('floor', value ? [parseInt(value)] : [])}
          />
        </div>

        {/* Type Filter */}
        <div className="w-40">
          <Select
            label="Type"
            placeholder="All types"
            options={typeOptions}
            value={filters.type?.[0] || ''}
            onChange={(value) => onFilterChange('type', value ? [value] : [])}
          />
        </div>

        {/* Needs Cleaning Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.needsCleaning || false}
              onChange={(e) => onFilterChange('needsCleaning', e.target.checked || undefined)}
              className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">Needs Cleaning</span>
          </label>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}


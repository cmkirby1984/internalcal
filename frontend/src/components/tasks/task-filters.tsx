'use client';

import { cn, formatEnumValue } from '@/lib/utils';
import { Button, Select } from '@/components/ui';
import { TaskStatus, TaskPriority, TaskType } from '@/lib/types';

interface TaskFiltersProps {
  filters: {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    type?: TaskType[];
    assignedTo?: string;
    overdue?: boolean;
  };
  onFilterChange: (key: string, value: unknown) => void;
  onClearFilters: () => void;
  className?: string;
}

const statusOptions = Object.values(TaskStatus).map((status) => ({
  value: status,
  label: formatEnumValue(status),
}));

const priorityOptions = Object.values(TaskPriority).map((priority) => ({
  value: priority,
  label: formatEnumValue(priority),
}));

const typeOptions = Object.values(TaskType).map((type) => ({
  value: type,
  label: formatEnumValue(type),
}));

export function TaskFilters({
  filters,
  onFilterChange,
  onClearFilters,
  className,
}: TaskFiltersProps) {
  const hasActiveFilters = 
    (filters.status && filters.status.length > 0) ||
    (filters.priority && filters.priority.length > 0) ||
    (filters.type && filters.type.length > 0) ||
    filters.assignedTo ||
    filters.overdue;

  return (
    <div className={cn('bg-[var(--bg-card)] rounded-xl p-4 shadow-[var(--shadow-card)]', className)}>
      <div className="flex flex-wrap items-end gap-4">
        {/* Status Filter */}
        <div className="w-44">
          <Select
            label="Status"
            placeholder="All statuses"
            options={statusOptions}
            value={filters.status?.[0] || ''}
            onChange={(value) => onFilterChange('status', value ? [value] : [])}
          />
        </div>

        {/* Priority Filter */}
        <div className="w-40">
          <Select
            label="Priority"
            placeholder="All priorities"
            options={priorityOptions}
            value={filters.priority?.[0] || ''}
            onChange={(value) => onFilterChange('priority', value ? [value] : [])}
          />
        </div>

        {/* Type Filter */}
        <div className="w-44">
          <Select
            label="Type"
            placeholder="All types"
            options={typeOptions}
            value={filters.type?.[0] || ''}
            onChange={(value) => onFilterChange('type', value ? [value] : [])}
          />
        </div>

        {/* Overdue Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.overdue || false}
              onChange={(e) => onFilterChange('overdue', e.target.checked || undefined)}
              className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">Overdue Only</span>
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


'use client';

import { cn, formatEnumValue } from '@/lib/utils';
import { SuiteStatus, TaskStatus, TaskPriority, EmployeeStatus } from '@/lib/types';

/* ─────────────────────────────────────────────────────────────────────────────
   SUITE STATUS BADGE
   ───────────────────────────────────────────────────────────────────────────── */

interface SuiteStatusBadgeProps {
  status: SuiteStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const suiteStatusColors: Record<SuiteStatus, { bg: string; text: string; dot: string }> = {
  [SuiteStatus.VACANT_CLEAN]: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  [SuiteStatus.VACANT_DIRTY]: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  [SuiteStatus.OCCUPIED_CLEAN]: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  [SuiteStatus.OCCUPIED_DIRTY]: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  [SuiteStatus.OUT_OF_ORDER]: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  [SuiteStatus.BLOCKED]: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
};

export function SuiteStatusBadge({ status, size = 'md', showDot = true, className }: SuiteStatusBadgeProps) {
  const colors = suiteStatusColors[status];
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        colors.bg,
        colors.text,
        sizes[size],
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />}
      {formatEnumValue(status)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TASK STATUS BADGE
   ───────────────────────────────────────────────────────────────────────────── */

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const taskStatusColors: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  [TaskStatus.PENDING]: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  [TaskStatus.ASSIGNED]: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  [TaskStatus.IN_PROGRESS]: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  [TaskStatus.PAUSED]: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  [TaskStatus.COMPLETED]: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  [TaskStatus.CANCELLED]: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  [TaskStatus.VERIFIED]: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
};

export function TaskStatusBadge({ status, size = 'md', showDot = true, className }: TaskStatusBadgeProps) {
  const colors = taskStatusColors[status];
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        colors.bg,
        colors.text,
        sizes[size],
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />}
      {formatEnumValue(status)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PRIORITY BADGE
   ───────────────────────────────────────────────────────────────────────────── */

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priorityColors: Record<TaskPriority, { bg: string; text: string }> = {
  [TaskPriority.LOW]: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  [TaskPriority.NORMAL]: { bg: 'bg-blue-100', text: 'text-blue-700' },
  [TaskPriority.HIGH]: { bg: 'bg-amber-100', text: 'text-amber-700' },
  [TaskPriority.URGENT]: { bg: 'bg-orange-100', text: 'text-orange-700' },
  [TaskPriority.EMERGENCY]: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function PriorityBadge({ priority, size = 'md', className }: PriorityBadgeProps) {
  const colors = priorityColors[priority];
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        colors.bg,
        colors.text,
        sizes[size],
        className
      )}
    >
      {formatEnumValue(priority)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EMPLOYEE STATUS BADGE
   ───────────────────────────────────────────────────────────────────────────── */

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus;
  isOnDuty?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const employeeStatusColors: Record<EmployeeStatus, { bg: string; text: string; dot: string }> = {
  [EmployeeStatus.ACTIVE]: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  [EmployeeStatus.ON_BREAK]: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  [EmployeeStatus.OFF_DUTY]: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  [EmployeeStatus.ON_LEAVE]: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  [EmployeeStatus.INACTIVE]: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

export function EmployeeStatusBadge({ status, isOnDuty, size = 'md', className }: EmployeeStatusBadgeProps) {
  const colors = employeeStatusColors[status];
  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  const displayStatus = isOnDuty !== undefined 
    ? (isOnDuty ? 'On Duty' : 'Off Duty')
    : formatEnumValue(status);

  const displayColors = isOnDuty !== undefined
    ? (isOnDuty ? employeeStatusColors[EmployeeStatus.ACTIVE] : employeeStatusColors[EmployeeStatus.OFF_DUTY])
    : colors;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        displayColors.bg,
        displayColors.text,
        sizes[size],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', displayColors.dot)} />
      {displayStatus}
    </span>
  );
}


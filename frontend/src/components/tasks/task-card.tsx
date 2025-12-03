'use client';

import { cn, formatRelativeTime, formatDuration } from '@/lib/utils';
import { Card, TaskStatusBadge, PriorityBadge, Avatar, Badge } from '@/components/ui';
import { UITask, TaskStatus, TaskPriority, TaskType } from '@/lib/types';

interface TaskCardProps {
  task: UITask;
  onClick?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  showSuite?: boolean;
  showAssignee?: boolean;
  compact?: boolean;
  draggable?: boolean;
  className?: string;
}

const taskTypeLabels: Record<TaskType, string> = {
  [TaskType.CLEANING]: 'Cleaning',
  [TaskType.MAINTENANCE]: 'Maintenance',
  [TaskType.INSPECTION]: 'Inspection',
  [TaskType.LINEN_CHANGE]: 'Linen Change',
  [TaskType.DEEP_CLEAN]: 'Deep Clean',
  [TaskType.EMERGENCY]: 'Emergency',
  [TaskType.CUSTOM]: 'Custom',
};

const priorityBorderColors: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'border-l-emerald-400',
  [TaskPriority.NORMAL]: 'border-l-blue-400',
  [TaskPriority.HIGH]: 'border-l-amber-500',
  [TaskPriority.URGENT]: 'border-l-orange-500',
  [TaskPriority.EMERGENCY]: 'border-l-red-500',
};

export function TaskCard({
  task,
  onClick,
  onStatusChange,
  showSuite = true,
  showAssignee = true,
  compact = false,
  draggable = false,
  className,
}: TaskCardProps) {
  const isOverdue = task.scheduledEnd && 
    new Date(task.scheduledEnd) < new Date() &&
    task.status !== TaskStatus.COMPLETED &&
    task.status !== TaskStatus.CANCELLED;

  return (
    <Card
      hoverable
      onClick={onClick}
      className={cn(
        'border-l-4 transition-all',
        priorityBorderColors[task.priority],
        isOverdue && 'ring-2 ring-red-200',
        draggable && 'cursor-grab active:cursor-grabbing',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={cn(
          'font-semibold text-[var(--text-primary)]',
          compact ? 'text-sm' : 'text-base'
        )}>
          {task.title}
        </h3>
        <TaskStatusBadge status={task.status} size="sm" />
      </div>

      {/* Description */}
      {!compact && task.description && (
        <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant="default" size="sm">
          {taskTypeLabels[task.type]}
        </Badge>
        
        {(task.priority === TaskPriority.HIGH || 
          task.priority === TaskPriority.URGENT || 
          task.priority === TaskPriority.EMERGENCY) && (
          <PriorityBadge priority={task.priority} size="sm" />
        )}

        {isOverdue && (
          <Badge variant="error" size="sm">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Overdue
          </Badge>
        )}
      </div>

      {/* Suite & Assignee */}
      <div className="flex items-center gap-4 text-sm">
        {showSuite && task.suiteId && (
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Suite #{task.suiteId.slice(0, 4)}</span>
          </div>
        )}

        {showAssignee && task.assignedTo && (
          <div className="flex items-center gap-1.5">
            <Avatar name={task.assignedTo} size="xs" />
            <span className="text-[var(--text-secondary)] truncate max-w-[100px]">
              {task.assignedTo}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            {task.scheduledStart && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatRelativeTime(task.scheduledStart)}
              </span>
            )}
            {task.estimatedDuration && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration(task.estimatedDuration)}
              </span>
            )}
          </div>
          
          {task.createdAt && (
            <span>Created {formatRelativeTime(task.createdAt)}</span>
          )}
        </div>
      )}
    </Card>
  );
}


'use client';

import { cn, formatRelativeTime } from '@/lib/utils';
import { UITask, TaskStatus, TaskPriority } from '@/lib/types';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui';

interface QuickTaskListProps {
  tasks: UITask[];
  onTaskClick?: (task: UITask) => void;
  showAssignee?: boolean;
  compact?: boolean;
  className?: string;
}

export function QuickTaskList({
  tasks,
  onTaskClick,
  showAssignee = false,
  compact = false,
  className,
}: QuickTaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className={cn('text-center py-8 text-[var(--text-muted)]', className)}>
        No tasks to display
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onTaskClick?.(task)}
          className={cn(
            'p-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-card)]',
            'hover:border-[var(--primary-300)] hover:shadow-sm transition-all cursor-pointer',
            task.priority === TaskPriority.URGENT && 'border-l-4 border-l-orange-500',
            task.priority === TaskPriority.EMERGENCY && 'border-l-4 border-l-red-500'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {task.title}
              </p>
              
              {!compact && task.description && (
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <TaskStatusBadge status={task.status} size="sm" />
                
                {(task.priority === TaskPriority.HIGH || 
                  task.priority === TaskPriority.URGENT || 
                  task.priority === TaskPriority.EMERGENCY) && (
                  <PriorityBadge priority={task.priority} size="sm" />
                )}
                
                {task.suiteId && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Suite #{task.suiteId.slice(0, 4)}
                  </span>
                )}
              </div>
            </div>
            
            {task.scheduledStart && (
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                {formatRelativeTime(task.scheduledStart)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


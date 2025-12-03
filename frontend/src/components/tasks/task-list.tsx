'use client';

import { cn } from '@/lib/utils';
import { UITask, TaskStatus } from '@/lib/types';
import { TaskCard } from './task-card';
import { NoTasksFound, SkeletonCard } from '@/components/ui';

interface TaskListProps {
  tasks: UITask[];
  isLoading?: boolean;
  onTaskClick?: (task: UITask) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onCreateTask?: () => void;
  showSuite?: boolean;
  showAssignee?: boolean;
  className?: string;
}

export function TaskList({
  tasks,
  isLoading = false,
  onTaskClick,
  onStatusChange,
  onCreateTask,
  showSuite = true,
  showAssignee = true,
  className,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return <NoTasksFound onCreateTask={onCreateTask} />;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => onTaskClick?.(task)}
          onStatusChange={(status) => onStatusChange?.(task.id, status)}
          showSuite={showSuite}
          showAssignee={showAssignee}
        />
      ))}
    </div>
  );
}


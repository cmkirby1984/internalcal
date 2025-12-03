'use client';

import { useMemo } from 'react';
import { cn, formatEnumValue } from '@/lib/utils';
import { UITask, TaskStatus } from '@/lib/types';
import { TaskCard } from './task-card';
import { Badge } from '@/components/ui';

interface TaskKanbanProps {
  tasks: UITask[];
  onTaskClick?: (task: UITask) => void;
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
  className?: string;
}

const kanbanColumns: TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.ASSIGNED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
];

const columnColors: Record<TaskStatus, { bg: string; border: string; text: string }> = {
  [TaskStatus.PENDING]: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
  [TaskStatus.ASSIGNED]: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  [TaskStatus.IN_PROGRESS]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  [TaskStatus.PAUSED]: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  [TaskStatus.COMPLETED]: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  [TaskStatus.CANCELLED]: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500' },
  [TaskStatus.VERIFIED]: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
};

export function TaskKanban({
  tasks,
  onTaskClick,
  onTaskMove,
  className,
}: TaskKanbanProps) {
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, UITask[]> = {} as Record<TaskStatus, UITask[]>;
    
    kanbanColumns.forEach((status) => {
      grouped[status] = [];
    });
    
    tasks.forEach((task) => {
      if (kanbanColumns.includes(task.status)) {
        grouped[task.status].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onTaskMove) {
      onTaskMove(taskId, status);
    }
  };

  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
      {kanbanColumns.map((status) => {
        const columnTasks = tasksByStatus[status];
        const colors = columnColors[status];

        return (
          <div
            key={status}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className={cn(
              'rounded-t-lg px-4 py-3 border-b-2',
              colors.bg,
              colors.border
            )}>
              <div className="flex items-center justify-between">
                <h3 className={cn('font-semibold', colors.text)}>
                  {formatEnumValue(status)}
                </h3>
                <Badge variant="default" size="sm">
                  {columnTasks.length}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <div className={cn(
              'min-h-[400px] p-3 rounded-b-lg border border-t-0',
              'bg-[var(--bg-hover)]',
              colors.border
            )}>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                      compact
                      draggable
                    />
                  </div>
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="py-8 text-center text-[var(--text-muted)] text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


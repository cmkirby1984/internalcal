/**
 * Tasks Selectors
 * Computed/derived state for tasks
 */

import { useTasksStore } from '../tasks.store';
import { useAuthStore } from '../auth.store';
import type { Task } from '../../types/entities';
import { TaskStatus, TaskPriority, TaskType } from '../../types/enums';

/**
 * Get all tasks as an array
 */
export const useAllTasks = (): Task[] => {
  return useTasksStore((state) =>
    state.allIds.map((id) => state.items[id]).filter(Boolean)
  );
};

/**
 * Get filtered tasks based on current filters
 */
export const useFilteredTasks = (): Task[] => {
  return useTasksStore((state) => {
    const { items, allIds, filters } = state;

    let filtered = allIds.map((id) => items[id]).filter(Boolean);

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((task) => filters.status!.includes(task.status));
    }

    // Apply type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((task) => filters.type!.includes(task.type));
    }

    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((task) => filters.priority!.includes(task.priority));
    }

    // Apply assignedTo filter
    if (filters.assignedTo) {
      filtered = filtered.filter((task) => task.assignedToId === filters.assignedTo);
    }

    // Apply suiteId filter
    if (filters.suiteId) {
      filtered = filtered.filter((task) => task.suiteId === filters.suiteId);
    }

    // Apply date range filter
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start).getTime();
      const endDate = new Date(filters.dateRange.end).getTime();

      filtered = filtered.filter((task) => {
        if (!task.scheduledStart) return false;
        const taskDate = new Date(task.scheduledStart).getTime();
        return taskDate >= startDate && taskDate <= endDate;
      });
    }

    return filtered;
  });
};

/**
 * Get tasks by suite ID
 */
export const useTasksBySuite = (suiteId: string | null): Task[] => {
  return useTasksStore((state) => {
    if (!suiteId) return [];
    const taskIds = state.bySuite[suiteId] || [];
    return taskIds.map((id) => state.items[id]).filter(Boolean);
  });
};

/**
 * Get tasks by employee ID
 */
export const useTasksByEmployee = (employeeId: string | null): Task[] => {
  return useTasksStore((state) => {
    if (!employeeId) return [];
    const taskIds = state.byEmployee[employeeId] || [];
    return taskIds.map((id) => state.items[id]).filter(Boolean);
  });
};

/**
 * Get tasks by status
 */
export const useTasksByStatus = (status: TaskStatus): Task[] => {
  return useTasksStore((state) => {
    const taskIds = state.byStatus[status] || [];
    return taskIds.map((id) => state.items[id]).filter(Boolean);
  });
};

/**
 * Get tasks by priority
 */
export const useTasksByPriority = (priority: TaskPriority): Task[] => {
  return useTasksStore((state) => {
    const taskIds = state.byPriority[priority] || [];
    return taskIds.map((id) => state.items[id]).filter(Boolean);
  });
};

/**
 * Get active tasks for current user
 */
export const useActiveTasksForCurrentUser = (): Task[] => {
  const currentUser = useAuthStore((state) => state.currentUser);
  
  return useTasksStore((state) => {
    if (!currentUser) return [];

    const taskIds = state.byEmployee[currentUser.id] || [];
    return taskIds
      .map((id) => state.items[id])
      .filter(
        (task) =>
          task &&
          (task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.IN_PROGRESS)
      );
  });
};

/**
 * Get overdue tasks
 */
export const useOverdueTasks = (): Task[] => {
  return useTasksStore((state) => {
    const now = Date.now();

    return state.allIds
      .map((id) => state.items[id])
      .filter((task) => {
        if (!task || !task.scheduledEnd) return false;

        const scheduledEnd = new Date(task.scheduledEnd).getTime();
        const isOverdue = scheduledEnd < now;
        const isNotComplete = ![
          TaskStatus.COMPLETED,
          TaskStatus.CANCELLED,
          TaskStatus.VERIFIED,
        ].includes(task.status);

        return isOverdue && isNotComplete;
      });
  });
};

/**
 * Get tasks for Kanban view (grouped by status)
 */
export const useTasksForKanban = (): Record<TaskStatus, Task[]> => {
  return useTasksStore((state) => {
    const { items, filters } = state;
    const kanban = {} as Record<TaskStatus, Task[]>;

    // Initialize all status columns
    Object.values(TaskStatus).forEach((status) => {
      kanban[status] = [];
    });

    // Get filtered tasks and group by status
    let tasks = state.allIds.map((id) => items[id]).filter(Boolean);

    // Apply non-status filters
    if (filters.type && filters.type.length > 0) {
      tasks = tasks.filter((task) => filters.type!.includes(task.type));
    }
    if (filters.priority && filters.priority.length > 0) {
      tasks = tasks.filter((task) => filters.priority!.includes(task.priority));
    }
    if (filters.assignedTo) {
      tasks = tasks.filter((task) => task.assignedToId === filters.assignedTo);
    }
    if (filters.suiteId) {
      tasks = tasks.filter((task) => task.suiteId === filters.suiteId);
    }

    tasks.forEach((task) => {
      kanban[task.status].push(task);
    });

    return kanban;
  });
};

/**
 * Get tasks for calendar view (grouped by date)
 */
export const useTasksForCalendar = (): Record<string, Task[]> => {
  return useTasksStore((state) => {
    const byDate: Record<string, Task[]> = {};

    state.allIds.forEach((id) => {
      const task = state.items[id];
      if (!task || !task.scheduledStart) return;

      const date = task.scheduledStart.split('T')[0]; // YYYY-MM-DD

      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push(task);
    });

    return byDate;
  });
};

/**
 * Get selected task
 */
export const useSelectedTask = (): Task | null => {
  return useTasksStore((state) =>
    state.selectedTaskId ? state.items[state.selectedTaskId] : null
  );
};

/**
 * Get active task (currently being worked on)
 */
export const useActiveTask = (): Task | null => {
  return useTasksStore((state) =>
    state.activeTaskId ? state.items[state.activeTaskId] : null
  );
};

/**
 * Get task by ID
 */
export const useTaskById = (taskId: string | null): Task | null => {
  return useTasksStore((state) => (taskId ? state.items[taskId] : null));
};

/**
 * Get task status counts
 */
export const useTaskStatusCounts = (): Record<TaskStatus, number> => {
  return useTasksStore((state) => {
    const counts = {} as Record<TaskStatus, number>;

    Object.values(TaskStatus).forEach((status) => {
      counts[status] = state.byStatus[status]?.length || 0;
    });

    return counts;
  });
};

/**
 * Get task priority counts
 */
export const useTaskPriorityCounts = (): Record<TaskPriority, number> => {
  return useTasksStore((state) => {
    const counts = {} as Record<TaskPriority, number>;

    Object.values(TaskPriority).forEach((priority) => {
      counts[priority] = state.byPriority[priority]?.length || 0;
    });

    return counts;
  });
};

/**
 * Get emergency tasks
 */
export const useEmergencyTasks = (): Task[] => {
  return useTasksStore((state) =>
    state.allIds
      .map((id) => state.items[id])
      .filter(
        (task) =>
          task &&
          (task.type === TaskType.EMERGENCY || task.priority === TaskPriority.EMERGENCY) &&
          task.status !== TaskStatus.COMPLETED &&
          task.status !== TaskStatus.CANCELLED
      )
  );
};

/**
 * Get tasks completed today
 */
export const useTasksCompletedToday = (): Task[] => {
  return useTasksStore((state) => {
    const today = new Date().toISOString().split('T')[0];

    return state.allIds
      .map((id) => state.items[id])
      .filter((task) => {
        if (!task || !task.completedAt) return false;
        return task.completedAt.startsWith(today);
      });
  });
};


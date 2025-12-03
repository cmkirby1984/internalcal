/**
 * Dashboard Selectors
 * Aggregated stats and KPIs for the dashboard
 */

import { useSuitesStore } from '../suites.store';
import { useTasksStore } from '../tasks.store';
import { useEmployeesStore } from '../employees.store';
import type { DashboardStats } from '../../types/state';
import { SuiteStatus, TaskStatus } from '../../types/enums';

/**
 * Get comprehensive dashboard statistics
 */
export const useDashboardStats = (): DashboardStats => {
  const suites = useSuitesStore((state) => state);
  const tasks = useTasksStore((state) => state);
  const employees = useEmployeesStore((state) => state);

  // Calculate suite stats
  const totalSuites = suites.allIds.length;
  let vacantClean = 0;
  let needsCleaning = 0;
  let outOfOrder = 0;
  let occupied = 0;

  suites.allIds.forEach((id) => {
    const suite = suites.items[id];
    if (!suite) return;

    switch (suite.status) {
      case SuiteStatus.VACANT_CLEAN:
        vacantClean++;
        break;
      case SuiteStatus.VACANT_DIRTY:
      case SuiteStatus.OCCUPIED_DIRTY:
        needsCleaning++;
        break;
      case SuiteStatus.OUT_OF_ORDER:
        outOfOrder++;
        break;
      case SuiteStatus.OCCUPIED_CLEAN:
      case SuiteStatus.OCCUPIED_DIRTY:
        occupied++;
        break;
    }
  });

  // Calculate occupancy rate
  const occupancyRate = totalSuites > 0 ? Math.round((occupied / totalSuites) * 100) : 0;

  // Calculate task stats
  const totalTasks = tasks.allIds.length;
  const pendingTasks = tasks.byStatus[TaskStatus.PENDING]?.length || 0;
  const inProgressTasks = tasks.byStatus[TaskStatus.IN_PROGRESS]?.length || 0;

  // Calculate overdue tasks
  const now = Date.now();
  let overdueTasks = 0;

  tasks.allIds.forEach((id) => {
    const task = tasks.items[id];
    if (!task || !task.scheduledEnd) return;

    const scheduledEnd = new Date(task.scheduledEnd).getTime();
    const isOverdue = scheduledEnd < now;
    const isNotComplete = ![
      TaskStatus.COMPLETED,
      TaskStatus.CANCELLED,
      TaskStatus.VERIFIED,
    ].includes(task.status);

    if (isOverdue && isNotComplete) {
      overdueTasks++;
    }
  });

  // Calculate completed today
  const today = new Date().toISOString().split('T')[0];
  let completedToday = 0;

  tasks.allIds.forEach((id) => {
    const task = tasks.items[id];
    if (task?.completedAt?.startsWith(today)) {
      completedToday++;
    }
  });

  // Employee stats
  const employeesOnDuty = employees.onDuty.length;
  const availableEmployees = employees.available.length;

  return {
    totalSuites,
    vacantClean,
    needsCleaning,
    outOfOrder,
    occupancyRate,
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedToday,
    overdueTasks,
    employeesOnDuty,
    availableEmployees,
  };
};

/**
 * Get suite status summary for dashboard cards
 */
export const useSuiteStatusSummary = () => {
  return useSuitesStore((state) => {
    const summary = {
      total: state.allIds.length,
      vacantClean: 0,
      vacantDirty: 0,
      occupiedClean: 0,
      occupiedDirty: 0,
      outOfOrder: 0,
      blocked: 0,
    };

    state.allIds.forEach((id) => {
      const suite = state.items[id];
      if (!suite) return;

      switch (suite.status) {
        case SuiteStatus.VACANT_CLEAN:
          summary.vacantClean++;
          break;
        case SuiteStatus.VACANT_DIRTY:
          summary.vacantDirty++;
          break;
        case SuiteStatus.OCCUPIED_CLEAN:
          summary.occupiedClean++;
          break;
        case SuiteStatus.OCCUPIED_DIRTY:
          summary.occupiedDirty++;
          break;
        case SuiteStatus.OUT_OF_ORDER:
          summary.outOfOrder++;
          break;
        case SuiteStatus.BLOCKED:
          summary.blocked++;
          break;
      }
    });

    return summary;
  });
};

/**
 * Get task status summary for dashboard
 */
export const useTaskStatusSummary = () => {
  return useTasksStore((state) => {
    const summary = {
      total: state.allIds.length,
      pending: state.byStatus[TaskStatus.PENDING]?.length || 0,
      assigned: state.byStatus[TaskStatus.ASSIGNED]?.length || 0,
      inProgress: state.byStatus[TaskStatus.IN_PROGRESS]?.length || 0,
      paused: state.byStatus[TaskStatus.PAUSED]?.length || 0,
      completed: state.byStatus[TaskStatus.COMPLETED]?.length || 0,
      cancelled: state.byStatus[TaskStatus.CANCELLED]?.length || 0,
      verified: state.byStatus[TaskStatus.VERIFIED]?.length || 0,
    };

    return summary;
  });
};

/**
 * Get employee availability summary
 */
export const useEmployeeAvailabilitySummary = () => {
  return useEmployeesStore((state) => ({
    total: state.allIds.length,
    onDuty: state.onDuty.length,
    available: state.available.length,
    busy: state.onDuty.length - state.available.length,
    offDuty: state.allIds.length - state.onDuty.length,
  }));
};

/**
 * Get priority task counts for dashboard alerts
 */
export const usePriorityTaskAlerts = () => {
  return useTasksStore((state) => {
    let emergency = 0;
    let urgent = 0;
    let high = 0;
    let overdue = 0;

    const now = Date.now();

    state.allIds.forEach((id) => {
      const task = state.items[id];
      if (!task) return;

      const isActive = ![
        TaskStatus.COMPLETED,
        TaskStatus.CANCELLED,
        TaskStatus.VERIFIED,
      ].includes(task.status);

      if (!isActive) return;

      // Check priority
      if (task.priority === 'EMERGENCY') emergency++;
      else if (task.priority === 'URGENT') urgent++;
      else if (task.priority === 'HIGH') high++;

      // Check overdue
      if (task.scheduledEnd) {
        const scheduledEnd = new Date(task.scheduledEnd).getTime();
        if (scheduledEnd < now) overdue++;
      }
    });

    return { emergency, urgent, high, overdue };
  });
};

/**
 * Get recent activity for dashboard feed
 */
export const useRecentTaskActivity = (limit: number = 10) => {
  return useTasksStore((state) => {
    const tasks = state.allIds
      .map((id) => state.items[id])
      .filter(Boolean)
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt).getTime();
        const bDate = new Date(b.updatedAt).getTime();
        return bDate - aDate;
      })
      .slice(0, limit);

    return tasks;
  });
};

/**
 * Get workload distribution by employee
 */
export const useWorkloadDistribution = () => {
  const employees = useEmployeesStore((state) => state);
  const tasks = useTasksStore((state) => state);

  return employees.onDuty.map((employeeId) => {
    const employee = employees.items[employeeId];
    const taskIds = tasks.byEmployee[employeeId] || [];

    const activeTasks = taskIds.filter((taskId) => {
      const task = tasks.items[taskId];
      return (
        task &&
        (task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.IN_PROGRESS)
      );
    }).length;

    const completedToday = taskIds.filter((taskId) => {
      const task = tasks.items[taskId];
      if (!task?.completedAt) return false;
      const today = new Date().toISOString().split('T')[0];
      return task.completedAt.startsWith(today);
    }).length;

    return {
      id: employeeId,
      name: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
      role: employee?.role,
      activeTasks,
      completedToday,
    };
  });
};


/**
 * Tasks Store
 * Manages task state with normalized data and groupings
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { TasksStore, TaskFilters } from '../types/state';
import type { Task } from '../types/entities';
import { TaskStatus, TaskPriority, TaskViewMode, SuiteStatus } from '../types/enums';
import { tasksApi } from '../api/endpoints';
import { useUIStore } from './ui.store';
import { useAuthStore } from './auth.store';

const initialFilters: TaskFilters = {
  status: null,
  type: null,
  priority: null,
  assignedTo: null,
  suiteId: null,
  dateRange: null,
};

const initialState = {
  items: {},
  allIds: [],
  bySuite: {},
  byEmployee: {},
  byStatus: {} as Record<TaskStatus, string[]>,
  byPriority: {} as Record<TaskPriority, string[]>,
  filters: initialFilters,
  viewMode: TaskViewMode.LIST,
  selectedTaskId: null,
  activeTaskId: null,
  activeTaskStartTime: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const useTasksStore = create<TasksStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ───────────────────────────────────────────────────────────────────────
      // FETCH OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      fetchAllTasks: async (options?: Record<string, unknown>) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          // The API might return { data: Task[], meta: ... } or just Task[]
          const response = await tasksApi.getAll(options as Parameters<typeof tasksApi.getAll>[0]);
          
          // Handle paginated response structure
          const tasks = Array.isArray(response) ? response : (response as any).data;

          if (!Array.isArray(tasks)) {
            throw new Error('Invalid API response format: expected array of tasks');
          }

          get().normalizeTasks(tasks);
          get().updateTaskGroupings();

          set((state) => {
            state.lastFetched = new Date().toISOString();
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message || 'Failed to load tasks';
            state.isLoading = false;
          });
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to load tasks',
            duration: 5000,
          });
        }
      },

      fetchTasksBySuite: async (suiteId: string) => {
        try {
          const tasks = await tasksApi.getBySuite(suiteId);
          get().normalizeTasks(tasks);
          get().updateTaskGroupings();
        } catch {
          // Silent fail for background fetches
        }
      },

      fetchTasksByEmployee: async (employeeId: string) => {
        try {
          const tasks = await tasksApi.getByEmployee(employeeId);
          get().normalizeTasks(tasks);
          get().updateTaskGroupings();
        } catch {
          // Silent fail
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // CRUD OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      createTask: async (taskData: Partial<Task>) => {
        try {
          if (!taskData.title || !taskData.type) {
            throw new Error('Title and type are required');
          }

          const newTask = await tasksApi.create(taskData);
          get().addTask(newTask);
          get().updateTaskGroupings();

          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Task created',
            duration: 3000,
          });

          return newTask;
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: (error as Error).message || 'Failed to create task',
            duration: 5000,
          });
          throw error;
        }
      },

      updateTask: async (taskId: string, updates: Partial<Task>) => {
        const originalTask = get().items[taskId];
        get().updateTaskLocal(taskId, updates);

        try {
          const updatedTask = await tasksApi.update(taskId, updates);
          get().updateTaskLocal(taskId, updatedTask);
          get().updateTaskGroupings();

          // Handle status changes
          if (updates.status && updates.status !== originalTask?.status) {
            get().handleTaskStatusChange(taskId, originalTask?.status, updates.status);
          }

          // Handle reassignment
          if (updates.assignedToId && updates.assignedToId !== originalTask?.assignedToId) {
            get().handleTaskReassignment(taskId, originalTask?.assignedToId, updates.assignedToId);
          }
        } catch (error) {
          // Rollback on error
          if (originalTask) {
            get().updateTaskLocal(taskId, originalTask);
          }
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to update task',
            duration: 5000,
          });
        }
      },

      deleteTask: async (taskId: string) => {
        try {
          await tasksApi.delete(taskId);
          get().removeTask(taskId);
          get().updateTaskGroupings();
          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Task deleted',
            duration: 3000,
          });
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to delete task',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // STATUS TRANSITIONS
      // ───────────────────────────────────────────────────────────────────────

      updateTaskStatus: async (taskId: string, newStatus: TaskStatus) => {
        const task = get().items[taskId];
        const timestamp = new Date().toISOString();
        const updates: Partial<Task> = { status: newStatus };

        // Add appropriate timestamps
        switch (newStatus) {
          case TaskStatus.IN_PROGRESS:
            if (!task?.actualStart) {
              updates.actualStart = timestamp;
            }
            break;

          case TaskStatus.COMPLETED:
            updates.actualEnd = timestamp;
            updates.completedAt = timestamp;

            // Calculate duration
            if (task?.actualStart) {
              const start = new Date(task.actualStart).getTime();
              const end = new Date(timestamp).getTime();
              updates.actualDuration = Math.round((end - start) / 60000); // minutes
            }
            break;

          case TaskStatus.PAUSED:
            // Could track pause time for analytics
            break;
        }

        await get().updateTask(taskId, updates);
      },

      assignTask: async (taskId: string, employeeId: string) => {
        const currentUser = useAuthStore.getState().currentUser;
        await get().updateTask(taskId, {
          assignedToId: employeeId,
          status: TaskStatus.ASSIGNED,
          assignedById: currentUser?.id,
        });
      },

      startTask: async (taskId: string) => {
        const { activeTaskId } = get();

        // Stop any currently active task
        if (activeTaskId) {
          await get().pauseTask(activeTaskId);
        }

        await get().updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);

        set((state) => {
          state.activeTaskId = taskId;
          state.activeTaskStartTime = new Date().toISOString();
        });

        useUIStore.getState().showToast({
          type: 'INFO',
          message: 'Task started',
          duration: 3000,
        });
      },

      pauseTask: async (taskId: string) => {
        await get().updateTaskStatus(taskId, TaskStatus.PAUSED);

        set((state) => {
          if (state.activeTaskId === taskId) {
            state.activeTaskId = null;
            state.activeTaskStartTime = null;
          }
        });
      },

      completeTask: async (taskId: string, completionNotes?: string) => {
        const task = get().items[taskId];

        await get().updateTask(taskId, {
          status: TaskStatus.COMPLETED,
          completionNotes: completionNotes || null,
          actualEnd: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        });

        set((state) => {
          if (state.activeTaskId === taskId) {
            state.activeTaskId = null;
            state.activeTaskStartTime = null;
          }
        });

        // Apply business rules
        if (task) {
          get().applyTaskCompletionRules(task);
        }

        useUIStore.getState().showToast({
          type: 'SUCCESS',
          message: 'Task completed!',
          duration: 3000,
        });
      },

      // ───────────────────────────────────────────────────────────────────────
      // LOCAL STATE UPDATES
      // ───────────────────────────────────────────────────────────────────────

      normalizeTasks: (tasks: any[]) => {
        set((state) => {
          tasks.forEach((task) => {
            // Flatten nested objects for UI consumption
            const uiTask = {
              ...task,
              suiteId: task.suite?.id || task.suiteId,
              suiteNumber: task.suite?.suiteNumber,
              assignedTo: task.assignedTo 
                ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                : null,
              assignedToId: task.assignedTo?.id || task.assignedToId,
            };

            state.items[task.id] = uiTask;
            if (!state.allIds.includes(task.id)) {
              state.allIds.push(task.id);
            }
          });
        });
      },

      addTask: (task: Task) => {
        set((state) => {
          state.items[task.id] = task;
          if (!state.allIds.includes(task.id)) {
            state.allIds.push(task.id);
          }
        });
      },

      updateTaskLocal: (taskId: string, updates: Partial<Task>) => {
        set((state) => {
          if (state.items[taskId]) {
            state.items[taskId] = {
              ...state.items[taskId],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
        });
      },

      removeTask: (taskId: string) => {
        set((state) => {
          delete state.items[taskId];
          state.allIds = state.allIds.filter((id) => id !== taskId);

          if (state.selectedTaskId === taskId) {
            state.selectedTaskId = null;
          }
          if (state.activeTaskId === taskId) {
            state.activeTaskId = null;
            state.activeTaskStartTime = null;
          }
        });
      },

      updateTaskGroupings: () => {
        set((state) => {
          // Clear existing groupings
          state.bySuite = {};
          state.byEmployee = {};
          state.byStatus = {} as Record<TaskStatus, string[]>;
          state.byPriority = {} as Record<TaskPriority, string[]>;

          // Rebuild groupings
          state.allIds.forEach((taskId) => {
            const task = state.items[taskId];
            if (!task) return;

            // Group by suite
            if (task.suiteId) {
              if (!state.bySuite[task.suiteId]) {
                state.bySuite[task.suiteId] = [];
              }
              state.bySuite[task.suiteId].push(taskId);
            }

            // Group by employee
            if (task.assignedToId) {
              if (!state.byEmployee[task.assignedToId]) {
                state.byEmployee[task.assignedToId] = [];
              }
              state.byEmployee[task.assignedToId].push(taskId);
            }

            // Group by status
            if (!state.byStatus[task.status]) {
              state.byStatus[task.status] = [];
            }
            state.byStatus[task.status].push(taskId);

            // Group by priority
            if (!state.byPriority[task.priority]) {
              state.byPriority[task.priority] = [];
            }
            state.byPriority[task.priority].push(taskId);
          });
        });
      },

      // ───────────────────────────────────────────────────────────────────────
      // FILTERING & VIEW
      // ───────────────────────────────────────────────────────────────────────

      setTaskFilters: (filters: Partial<TaskFilters>) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      clearTaskFilters: () => {
        set((state) => {
          state.filters = initialFilters;
        });
      },

      setTaskViewMode: (viewMode: TaskViewMode) => {
        set((state) => {
          state.viewMode = viewMode;
        });
      },

      selectTask: (taskId: string | null) => {
        set((state) => {
          state.selectedTaskId = taskId;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // ───────────────────────────────────────────────────────────────────────
      // BUSINESS LOGIC HELPERS (internal)
      // ───────────────────────────────────────────────────────────────────────

      handleTaskStatusChange: (
        _taskId: string,
        _oldStatus: TaskStatus | undefined,
        _newStatus: TaskStatus
      ) => {
        // Business logic for status changes handled by backend
        // Could trigger suite status updates, notifications, etc.
      },

      handleTaskReassignment: (
        _taskId: string,
        _oldEmployeeId: string | null | undefined,
        _newEmployeeId: string
      ) => {
        // Notification creation handled by backend
        get().updateTaskGroupings();
      },

      applyTaskCompletionRules: (task: Task) => {
        // When cleaning task is completed, could update suite status
        // This is typically handled by backend event listeners
        if (task.type === 'CLEANING' && task.suiteId) {
          // Import dynamically to avoid circular dependency
          import('./suites.store').then(({ useSuitesStore }) => {
            const suite = useSuitesStore.getState().items[task.suiteId!];
            if (suite) {
              if (suite.status === SuiteStatus.VACANT_DIRTY) {
                useSuitesStore.getState().updateSuiteStatus(task.suiteId!, SuiteStatus.VACANT_CLEAN);
              } else if (suite.status === SuiteStatus.OCCUPIED_DIRTY) {
                useSuitesStore.getState().updateSuiteStatus(task.suiteId!, SuiteStatus.OCCUPIED_CLEAN);
              }
            }
          });
        }
      },
    })),
    { name: 'TasksStore' }
  )
);


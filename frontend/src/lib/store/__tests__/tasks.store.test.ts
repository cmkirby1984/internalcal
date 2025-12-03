import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTasksStore } from '../tasks.store';
import { TaskStatus, TaskType, TaskPriority, TaskViewMode } from '../../types/enums';
import type { Task } from '../../types/entities';

// Mock the API
vi.mock('../../api/endpoints', () => ({
  tasksApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getBySuite: vi.fn(),
    getByEmployee: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock other stores
vi.mock('../ui.store', () => ({
  useUIStore: {
    getState: () => ({
      showToast: vi.fn(),
    }),
  },
}));

vi.mock('../auth.store', () => ({
  useAuthStore: {
    getState: () => ({
      currentUser: { id: 'user-1' },
    }),
  },
}));

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  type: TaskType.CLEANING,
  priority: TaskPriority.NORMAL,
  status: TaskStatus.PENDING,
  title: 'Clean Room 101',
  description: 'Standard cleaning',
  assignedToId: null,
  assignedById: null,
  suiteId: 'suite-1',
  scheduledStart: '2024-01-01T09:00:00Z',
  scheduledEnd: '2024-01-01T10:00:00Z',
  estimatedDuration: 60,
  actualStart: null,
  actualEnd: null,
  actualDuration: null,
  completionNotes: null,
  verifiedById: null,
  verificationNotes: null,
  customFields: null,
  recurring: false,
  recurrencePattern: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  completedAt: null,
  attachedPhotos: [],
  parentTaskId: null,
  ...overrides,
});

describe('TasksStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useTasksStore.setState({
      items: {},
      allIds: [],
      bySuite: {},
      byEmployee: {},
      byStatus: {} as Record<TaskStatus, string[]>,
      byPriority: {} as Record<TaskPriority, string[]>,
      filters: {
        status: null,
        type: null,
        priority: null,
        assignedTo: null,
        suiteId: null,
        dateRange: null,
      },
      viewMode: TaskViewMode.LIST,
      selectedTaskId: null,
      activeTaskId: null,
      activeTaskStartTime: null,
      isLoading: false,
      error: null,
      lastFetched: null,
    });
  });

  describe('normalizeTasks', () => {
    it('should normalize tasks into the store', () => {
      const tasks = [
        createMockTask({ id: 'task-1', title: 'Task 1' }),
        createMockTask({ id: 'task-2', title: 'Task 2' }),
      ];

      useTasksStore.getState().normalizeTasks(tasks);

      const state = useTasksStore.getState();
      expect(state.allIds).toHaveLength(2);
      expect(state.items['task-1'].title).toBe('Task 1');
      expect(state.items['task-2'].title).toBe('Task 2');
    });
  });

  describe('updateTaskGroupings', () => {
    it('should group tasks by suite', () => {
      const tasks = [
        createMockTask({ id: 'task-1', suiteId: 'suite-1' }),
        createMockTask({ id: 'task-2', suiteId: 'suite-1' }),
        createMockTask({ id: 'task-3', suiteId: 'suite-2' }),
      ];

      useTasksStore.getState().normalizeTasks(tasks);
      useTasksStore.getState().updateTaskGroupings();

      const state = useTasksStore.getState();
      expect(state.bySuite['suite-1']).toHaveLength(2);
      expect(state.bySuite['suite-2']).toHaveLength(1);
    });

    it('should group tasks by employee', () => {
      const tasks = [
        createMockTask({ id: 'task-1', assignedToId: 'emp-1' }),
        createMockTask({ id: 'task-2', assignedToId: 'emp-1' }),
        createMockTask({ id: 'task-3', assignedToId: 'emp-2' }),
      ];

      useTasksStore.getState().normalizeTasks(tasks);
      useTasksStore.getState().updateTaskGroupings();

      const state = useTasksStore.getState();
      expect(state.byEmployee['emp-1']).toHaveLength(2);
      expect(state.byEmployee['emp-2']).toHaveLength(1);
    });

    it('should group tasks by status', () => {
      const tasks = [
        createMockTask({ id: 'task-1', status: TaskStatus.PENDING }),
        createMockTask({ id: 'task-2', status: TaskStatus.PENDING }),
        createMockTask({ id: 'task-3', status: TaskStatus.IN_PROGRESS }),
      ];

      useTasksStore.getState().normalizeTasks(tasks);
      useTasksStore.getState().updateTaskGroupings();

      const state = useTasksStore.getState();
      expect(state.byStatus[TaskStatus.PENDING]).toHaveLength(2);
      expect(state.byStatus[TaskStatus.IN_PROGRESS]).toHaveLength(1);
    });

    it('should group tasks by priority', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: TaskPriority.NORMAL }),
        createMockTask({ id: 'task-2', priority: TaskPriority.HIGH }),
        createMockTask({ id: 'task-3', priority: TaskPriority.HIGH }),
      ];

      useTasksStore.getState().normalizeTasks(tasks);
      useTasksStore.getState().updateTaskGroupings();

      const state = useTasksStore.getState();
      expect(state.byPriority[TaskPriority.NORMAL]).toHaveLength(1);
      expect(state.byPriority[TaskPriority.HIGH]).toHaveLength(2);
    });
  });

  describe('addTask', () => {
    it('should add a new task', () => {
      const task = createMockTask();

      useTasksStore.getState().addTask(task);

      const state = useTasksStore.getState();
      expect(state.allIds).toContain('task-1');
      expect(state.items['task-1']).toEqual(task);
    });
  });

  describe('updateTaskLocal', () => {
    it('should update task properties', () => {
      const task = createMockTask();
      useTasksStore.getState().addTask(task);

      useTasksStore.getState().updateTaskLocal('task-1', {
        status: TaskStatus.IN_PROGRESS,
        actualStart: '2024-01-01T09:15:00Z',
      });

      const state = useTasksStore.getState();
      expect(state.items['task-1'].status).toBe(TaskStatus.IN_PROGRESS);
      expect(state.items['task-1'].actualStart).toBe('2024-01-01T09:15:00Z');
    });
  });

  describe('removeTask', () => {
    it('should remove a task', () => {
      const task = createMockTask();
      useTasksStore.getState().addTask(task);

      useTasksStore.getState().removeTask('task-1');

      const state = useTasksStore.getState();
      expect(state.allIds).not.toContain('task-1');
      expect(state.items['task-1']).toBeUndefined();
    });

    it('should clear selectedTaskId if removed task was selected', () => {
      const task = createMockTask();
      useTasksStore.getState().addTask(task);
      useTasksStore.getState().selectTask('task-1');

      useTasksStore.getState().removeTask('task-1');

      const state = useTasksStore.getState();
      expect(state.selectedTaskId).toBeNull();
    });

    it('should clear activeTaskId if removed task was active', () => {
      useTasksStore.setState({
        ...useTasksStore.getState(),
        items: { 'task-1': createMockTask() },
        allIds: ['task-1'],
        activeTaskId: 'task-1',
        activeTaskStartTime: '2024-01-01T09:00:00Z',
      });

      useTasksStore.getState().removeTask('task-1');

      const state = useTasksStore.getState();
      expect(state.activeTaskId).toBeNull();
      expect(state.activeTaskStartTime).toBeNull();
    });
  });

  describe('filters', () => {
    it('should set filters', () => {
      useTasksStore.getState().setTaskFilters({
        status: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        priority: [TaskPriority.HIGH],
      });

      const state = useTasksStore.getState();
      expect(state.filters.status).toEqual([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]);
      expect(state.filters.priority).toEqual([TaskPriority.HIGH]);
    });

    it('should clear filters', () => {
      useTasksStore.getState().setTaskFilters({
        status: [TaskStatus.PENDING],
        assignedTo: 'emp-1',
      });

      useTasksStore.getState().clearTaskFilters();

      const state = useTasksStore.getState();
      expect(state.filters.status).toBeNull();
      expect(state.filters.assignedTo).toBeNull();
    });
  });

  describe('view mode', () => {
    it('should set view mode', () => {
      useTasksStore.getState().setTaskViewMode(TaskViewMode.KANBAN);

      const state = useTasksStore.getState();
      expect(state.viewMode).toBe(TaskViewMode.KANBAN);
    });
  });

  describe('selection', () => {
    it('should select a task', () => {
      useTasksStore.getState().selectTask('task-1');

      const state = useTasksStore.getState();
      expect(state.selectedTaskId).toBe('task-1');
    });

    it('should deselect a task', () => {
      useTasksStore.getState().selectTask('task-1');
      useTasksStore.getState().selectTask(null);

      const state = useTasksStore.getState();
      expect(state.selectedTaskId).toBeNull();
    });
  });
});


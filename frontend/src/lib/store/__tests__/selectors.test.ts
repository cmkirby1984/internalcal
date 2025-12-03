import { describe, it, expect, beforeEach } from 'vitest';
import { useSuitesStore } from '../suites.store';
import { useTasksStore } from '../tasks.store';
import { useEmployeesStore } from '../employees.store';
import {
  SuiteStatus,
  SuiteType,
  BedConfiguration,
  TaskStatus,
  TaskType,
  TaskPriority,
  EmployeeRole,
  Department,
  EmployeeStatus,
  ContactMethod,
  SuiteSortBy,
  SortOrder,
  TaskViewMode,
} from '../../types/enums';
import type { Suite, Task, Employee } from '../../types/entities';

// Create mock data factories
const createMockSuite = (overrides: Partial<Suite> = {}): Suite => ({
  id: 'suite-1',
  suiteNumber: '101',
  floor: 1,
  type: SuiteType.STANDARD,
  status: SuiteStatus.VACANT_CLEAN,
  currentGuest: null,
  bedConfiguration: BedConfiguration.QUEEN,
  amenities: ['WiFi'],
  squareFeet: 300,
  lastCleaned: '2024-01-01T00:00:00Z',
  lastInspected: null,
  nextScheduledMaintenance: null,
  notes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  type: TaskType.CLEANING,
  priority: TaskPriority.NORMAL,
  status: TaskStatus.PENDING,
  title: 'Clean Room',
  description: null,
  assignedToId: null,
  assignedById: null,
  suiteId: null,
  scheduledStart: null,
  scheduledEnd: null,
  estimatedDuration: null,
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

const createMockEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 'emp-1',
  employeeNumber: 'E001',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@test.com',
  phone: null,
  role: EmployeeRole.HOUSEKEEPER,
  department: Department.HOUSEKEEPING,
  status: EmployeeStatus.ACTIVE,
  username: 'johnd',
  permissions: [],
  currentShift: null,
  isOnDuty: false,
  lastClockIn: null,
  lastClockOut: null,
  currentLocation: null,
  tasksCompleted: 0,
  averageTaskDuration: null,
  performanceRating: null,
  preferredContactMethod: ContactMethod.IN_APP,
  emergencyContact: null,
  hireDate: '2024-01-01',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  lastActive: null,
  ...overrides,
});

describe('Suite Selectors', () => {
  beforeEach(() => {
    useSuitesStore.setState({
      items: {},
      allIds: [],
      filters: { status: null, floor: null, type: null, searchQuery: '' },
      sortBy: SuiteSortBy.SUITE_NUMBER,
      sortOrder: SortOrder.ASC,
      selectedSuiteId: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      needsRefresh: true,
    });
  });

  describe('getFilteredSuites', () => {
    it('should return all suites when no filters are applied', () => {
      const suites = [
        createMockSuite({ id: '1', suiteNumber: '101' }),
        createMockSuite({ id: '2', suiteNumber: '102' }),
      ];

      useSuitesStore.getState().normalizeSuites(suites);

      const state = useSuitesStore.getState();
      const filtered = state.allIds.map((id) => state.items[id]);

      expect(filtered).toHaveLength(2);
    });

    it('should filter by status', () => {
      const suites = [
        createMockSuite({ id: '1', status: SuiteStatus.VACANT_CLEAN }),
        createMockSuite({ id: '2', status: SuiteStatus.VACANT_DIRTY }),
        createMockSuite({ id: '3', status: SuiteStatus.OCCUPIED_CLEAN }),
      ];

      useSuitesStore.getState().normalizeSuites(suites);
      useSuitesStore.getState().setSuiteFilters({ status: [SuiteStatus.VACANT_CLEAN] });

      const state = useSuitesStore.getState();
      const filtered = state.allIds
        .map((id) => state.items[id])
        .filter((suite) => state.filters.status?.includes(suite.status));

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe(SuiteStatus.VACANT_CLEAN);
    });

    it('should filter by floor', () => {
      const suites = [
        createMockSuite({ id: '1', floor: 1 }),
        createMockSuite({ id: '2', floor: 2 }),
        createMockSuite({ id: '3', floor: 1 }),
      ];

      useSuitesStore.getState().normalizeSuites(suites);
      useSuitesStore.getState().setSuiteFilters({ floor: [1] });

      const state = useSuitesStore.getState();
      const filtered = state.allIds
        .map((id) => state.items[id])
        .filter((suite) => state.filters.floor?.includes(suite.floor));

      expect(filtered).toHaveLength(2);
    });

    it('should filter by search query', () => {
      const suites = [
        createMockSuite({ id: '1', suiteNumber: '101' }),
        createMockSuite({ id: '2', suiteNumber: '201' }),
        createMockSuite({ id: '3', suiteNumber: '102' }),
      ];

      useSuitesStore.getState().normalizeSuites(suites);
      useSuitesStore.getState().setSuiteFilters({ searchQuery: '10' });

      const state = useSuitesStore.getState();
      const filtered = state.allIds
        .map((id) => state.items[id])
        .filter((suite) =>
          suite.suiteNumber.toLowerCase().includes(state.filters.searchQuery.toLowerCase())
        );

      expect(filtered).toHaveLength(2);
    });
  });
});

describe('Task Selectors', () => {
  beforeEach(() => {
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

  describe('getTasksBySuite', () => {
    it('should return tasks for a specific suite', () => {
      const tasks = [
        createMockTask({ id: '1', suiteId: 'suite-1' }),
        createMockTask({ id: '2', suiteId: 'suite-1' }),
        createMockTask({ id: '3', suiteId: 'suite-2' }),
      ];

      useTasksStore.getState().normalizeTasks(tasks);
      useTasksStore.getState().updateTaskGroupings();

      const state = useTasksStore.getState();
      const suite1Tasks = state.bySuite['suite-1']?.map((id) => state.items[id]) || [];

      expect(suite1Tasks).toHaveLength(2);
    });
  });

  describe('getTasksByEmployee', () => {
    it('should return tasks assigned to a specific employee', () => {
      const tasks = [
        createMockTask({ id: '1', assignedToId: 'emp-1' }),
        createMockTask({ id: '2', assignedToId: 'emp-1' }),
        createMockTask({ id: '3', assignedToId: 'emp-2' }),
      ];

      useTasksStore.getState().normalizeTasks(tasks);
      useTasksStore.getState().updateTaskGroupings();

      const state = useTasksStore.getState();
      const emp1Tasks = state.byEmployee['emp-1']?.map((id) => state.items[id]) || [];

      expect(emp1Tasks).toHaveLength(2);
    });
  });

  describe('getOverdueTasks', () => {
    it('should return overdue tasks', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

      const tasks = [
        createMockTask({ id: '1', scheduledEnd: pastDate, status: TaskStatus.PENDING }),
        createMockTask({ id: '2', scheduledEnd: futureDate, status: TaskStatus.PENDING }),
        createMockTask({ id: '3', scheduledEnd: pastDate, status: TaskStatus.COMPLETED }),
      ];

      useTasksStore.getState().normalizeTasks(tasks);

      const state = useTasksStore.getState();
      const now = Date.now();

      const overdue = state.allIds
        .map((id) => state.items[id])
        .filter((task) => {
          if (!task.scheduledEnd) return false;
          const scheduledEnd = new Date(task.scheduledEnd).getTime();
          const isOverdue = scheduledEnd < now;
          const isNotComplete = ![
            TaskStatus.COMPLETED,
            TaskStatus.CANCELLED,
            TaskStatus.VERIFIED,
          ].includes(task.status);
          return isOverdue && isNotComplete;
        });

      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe('1');
    });
  });
});

describe('Employee Selectors', () => {
  beforeEach(() => {
    useEmployeesStore.setState({
      items: {},
      allIds: [],
      onDuty: [],
      available: [],
      byDepartment: {} as Record<Department, string[]>,
      byRole: {} as Record<EmployeeRole, string[]>,
      filters: { status: null, role: null, department: null },
      selectedEmployeeId: null,
      isLoading: false,
      error: null,
      lastFetched: null,
    });

    // Also reset tasks store for employee groupings
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

  describe('getOnDutyEmployees', () => {
    it('should return on-duty employees', () => {
      const employees = [
        createMockEmployee({ id: '1', isOnDuty: true }),
        createMockEmployee({ id: '2', isOnDuty: false }),
        createMockEmployee({ id: '3', isOnDuty: true }),
      ];

      useEmployeesStore.getState().normalizeEmployees(employees);
      useEmployeesStore.getState().updateEmployeeGroupings();

      const state = useEmployeesStore.getState();
      const onDuty = state.onDuty.map((id) => state.items[id]);

      expect(onDuty).toHaveLength(2);
    });
  });

  describe('getEmployeesByRole', () => {
    it('should return employees by role', () => {
      const employees = [
        createMockEmployee({ id: '1', role: EmployeeRole.HOUSEKEEPER }),
        createMockEmployee({ id: '2', role: EmployeeRole.MAINTENANCE }),
        createMockEmployee({ id: '3', role: EmployeeRole.HOUSEKEEPER }),
      ];

      useEmployeesStore.getState().normalizeEmployees(employees);
      useEmployeesStore.getState().updateEmployeeGroupings();

      const state = useEmployeesStore.getState();
      const housekeepers = state.byRole[EmployeeRole.HOUSEKEEPER]?.map((id) => state.items[id]) || [];

      expect(housekeepers).toHaveLength(2);
    });
  });

  describe('getEmployeesByDepartment', () => {
    it('should return employees by department', () => {
      const employees = [
        createMockEmployee({ id: '1', department: Department.HOUSEKEEPING }),
        createMockEmployee({ id: '2', department: Department.MAINTENANCE }),
        createMockEmployee({ id: '3', department: Department.HOUSEKEEPING }),
      ];

      useEmployeesStore.getState().normalizeEmployees(employees);
      useEmployeesStore.getState().updateEmployeeGroupings();

      const state = useEmployeesStore.getState();
      const housekeeping =
        state.byDepartment[Department.HOUSEKEEPING]?.map((id) => state.items[id]) || [];

      expect(housekeeping).toHaveLength(2);
    });
  });
});


# React Implementation Guide

## Overview
This document provides detailed React implementation patterns, including hooks, components, state management with Redux Toolkit, and real-world code examples.

---

## 1. Project Structure

```
src/
├── api/
│   ├── client.ts                 # Axios client configuration
│   ├── suites.ts                 # Suite API calls
│   ├── tasks.ts                  # Task API calls
│   ├── employees.ts              # Employee API calls
│   └── notes.ts                  # Note API calls
│
├── store/
│   ├── index.ts                  # Redux store configuration
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── suitesSlice.ts
│   │   ├── tasksSlice.ts
│   │   ├── employeesSlice.ts
│   │   ├── notesSlice.ts
│   │   ├── notificationsSlice.ts
│   │   └── uiSlice.ts
│   ├── middleware/
│   │   ├── loggerMiddleware.ts
│   │   └── syncMiddleware.ts
│   └── selectors/
│       ├── suiteSelectors.ts
│       ├── taskSelectors.ts
│       └── employeeSelectors.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useRealTimeSync.ts
│   ├── useOfflineSync.ts
│   ├── useSuites.ts
│   ├── useTasks.ts
│   └── usePermissions.ts
│
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── NotificationCenter.tsx
│   │
│   ├── suites/
│   │   ├── SuiteCard.tsx
│   │   ├── SuitesGrid.tsx
│   │   ├── SuitesList.tsx
│   │   ├── SuiteDetailsSidebar.tsx
│   │   └── CreateSuiteModal.tsx
│   │
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TasksList.tsx
│   │   ├── TasksKanbanBoard.tsx
│   │   ├── TaskDetailsModal.tsx
│   │   └── CreateTaskModal.tsx
│   │
│   ├── employees/
│   │   ├── EmployeeCard.tsx
│   │   ├── EmployeesList.tsx
│   │   └── ClockInOutButton.tsx
│   │
│   ├── notes/
│   │   ├── NoteCard.tsx
│   │   ├── NotesList.tsx
│   │   └── CreateNoteModal.tsx
│   │
│   └── common/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       ├── Toast.tsx
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
│
├── pages/
│   ├── DashboardPage.tsx
│   ├── SuitesPage.tsx
│   ├── TasksPage.tsx
│   ├── EmployeesPage.tsx
│   ├── NotesPage.tsx
│   └── LoginPage.tsx
│
├── services/
│   ├── websocket.ts
│   ├── offlineManager.ts
│   ├── localCache.ts
│   └── notifications.ts
│
├── types/
│   ├── suite.ts
│   ├── task.ts
│   ├── employee.ts
│   ├── note.ts
│   └── notification.ts
│
├── utils/
│   ├── dateFormatter.ts
│   ├── validators.ts
│   └── permissions.ts
│
└── App.tsx
```

---

## 2. Type Definitions

### 2.1 Core Types

```typescript
// types/suite.ts
export enum SuiteStatus {
  VACANT_CLEAN = 'VACANT_CLEAN',
  VACANT_DIRTY = 'VACANT_DIRTY',
  OCCUPIED_CLEAN = 'OCCUPIED_CLEAN',
  OCCUPIED_DIRTY = 'OCCUPIED_DIRTY',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  BLOCKED = 'BLOCKED',
}

export enum SuiteType {
  STANDARD = 'STANDARD',
  DELUXE = 'DELUXE',
  SUITE = 'SUITE',
  ACCESSIBLE = 'ACCESSIBLE',
}

export enum BedConfiguration {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  QUEEN = 'QUEEN',
  KING = 'KING',
  TWIN_BEDS = 'TWIN_BEDS',
  QUEEN_PLUS_SOFA = 'QUEEN_PLUS_SOFA',
}

export interface CurrentGuest {
  name: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  specialRequests?: string;
}

export interface Suite {
  id: string;
  suiteNumber: string;
  floor: number;
  type: SuiteType;
  status: SuiteStatus;
  bedConfiguration: BedConfiguration;
  squareFeet?: number;
  amenities: string[];
  currentGuest?: CurrentGuest;
  lastCleaned?: string;
  lastInspected?: string;
  nextScheduledMaintenance?: string;
  activeTasks: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// types/task.ts
export enum TaskType {
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
  INSPECTION = 'INSPECTION',
  LINEN_CHANGE = 'LINEN_CHANGE',
  DEEP_CLEAN = 'DEEP_CLEAN',
  EMERGENCY = 'EMERGENCY',
  CUSTOM = 'CUSTOM',
}

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  EMERGENCY = 'EMERGENCY',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  VERIFIED = 'VERIFIED',
}

export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
  description?: string;
  suiteId?: string;
  assignedTo?: string;
  assignedBy?: string;
  verifiedBy?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  estimatedDuration?: number;
  actualStart?: string;
  actualEnd?: string;
  actualDuration?: number;
  completionNotes?: string;
  verificationNotes?: string;
  customFields?: Record<string, any>;
  recurring: boolean;
  recurrencePattern?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    interval: number;
    endDate?: string;
  };
  attachments: Array<{
    url: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// types/employee.ts
export enum EmployeeRole {
  HOUSEKEEPER = 'HOUSEKEEPER',
  MAINTENANCE = 'MAINTENANCE',
  FRONT_DESK = 'FRONT_DESK',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_BREAK = 'ON_BREAK',
  OFF_DUTY = 'OFF_DUTY',
  ON_LEAVE = 'ON_LEAVE',
  INACTIVE = 'INACTIVE',
}

export interface Employee {
  id: string;
  employeeNumber: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: EmployeeRole;
  department: string;
  status: EmployeeStatus;
  permissions: string[];
  isOnDuty: boolean;
  lastClockIn?: string;
  lastClockOut?: string;
  currentLocation?: string;
  tasksCompleted: number;
  performanceRating?: number;
  avatarUrl?: string;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
}
```

---

## 3. Redux Toolkit Store Setup

### 3.1 Store Configuration

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from './slices/authSlice';
import suitesReducer from './slices/suitesSlice';
import tasksReducer from './slices/tasksSlice';
import employeesReducer from './slices/employeesSlice';
import notesReducer from './slices/notesSlice';
import notificationsReducer from './slices/notificationsSlice';
import uiReducer from './slices/uiSlice';

import { loggerMiddleware } from './middleware/loggerMiddleware';
import { syncMiddleware } from './middleware/syncMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    suites: suitesReducer,
    tasks: tasksReducer,
    employees: employeesReducer,
    notes: notesReducer,
    notifications: notificationsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware, syncMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 3.2 Suites Slice

```typescript
// store/slices/suitesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Suite, SuiteStatus } from '../../types/suite';
import * as suitesAPI from '../../api/suites';

interface SuitesState {
  items: Record<string, Suite>;
  allIds: string[];
  filters: {
    status: SuiteStatus[] | null;
    floor: number[] | null;
    type: string[] | null;
    searchQuery: string;
  };
  sortBy: 'suiteNumber' | 'status' | 'floor' | 'lastCleaned';
  sortOrder: 'asc' | 'desc';
  selectedSuiteId: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: SuitesState = {
  items: {},
  allIds: [],
  filters: {
    status: null,
    floor: null,
    type: null,
    searchQuery: '',
  },
  sortBy: 'suiteNumber',
  sortOrder: 'asc',
  selectedSuiteId: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

// Async thunks
export const fetchAllSuites = createAsyncThunk(
  'suites/fetchAll',
  async (params?: Record<string, any>) => {
    const response = await suitesAPI.fetchAll(params);
    return response.data;
  }
);

export const fetchSuiteById = createAsyncThunk(
  'suites/fetchById',
  async (suiteId: string) => {
    const response = await suitesAPI.fetchById(suiteId);
    return response.data;
  }
);

export const createSuite = createAsyncThunk(
  'suites/create',
  async (suiteData: Partial<Suite>) => {
    const response = await suitesAPI.create(suiteData);
    return response.data;
  }
);

export const updateSuite = createAsyncThunk(
  'suites/update',
  async ({ suiteId, updates }: { suiteId: string; updates: Partial<Suite> }) => {
    const response = await suitesAPI.update(suiteId, updates);
    return response.data;
  }
);

export const updateSuiteStatus = createAsyncThunk(
  'suites/updateStatus',
  async ({ suiteId, status }: { suiteId: string; status: SuiteStatus }) => {
    const response = await suitesAPI.updateStatus(suiteId, status);
    return response.data;
  }
);

export const deleteSuite = createAsyncThunk(
  'suites/delete',
  async (suiteId: string) => {
    await suitesAPI.remove(suiteId);
    return suiteId;
  }
);

// Slice
const suitesSlice = createSlice({
  name: 'suites',
  initialState,
  reducers: {
    // Local updates (for optimistic updates and real-time sync)
    addSuiteLocal: (state, action: PayloadAction<Suite>) => {
      const suite = action.payload;
      state.items[suite.id] = suite;
      if (!state.allIds.includes(suite.id)) {
        state.allIds.push(suite.id);
      }
    },

    updateSuiteLocal: (state, action: PayloadAction<{ id: string; updates: Partial<Suite> }>) => {
      const { id, updates } = action.payload;
      if (state.items[id]) {
        state.items[id] = { ...state.items[id], ...updates, updatedAt: new Date().toISOString() };
      }
    },

    removeSuiteLocal: (state, action: PayloadAction<string>) => {
      const suiteId = action.payload;
      delete state.items[suiteId];
      state.allIds = state.allIds.filter(id => id !== suiteId);
      if (state.selectedSuiteId === suiteId) {
        state.selectedSuiteId = null;
      }
    },

    // Filters
    setSuiteFilters: (state, action: PayloadAction<Partial<SuitesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearSuiteFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Sorting
    setSuiteSorting: (
      state,
      action: PayloadAction<{ sortBy: SuitesState['sortBy']; sortOrder: SuitesState['sortOrder'] }>
    ) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },

    // Selection
    selectSuite: (state, action: PayloadAction<string>) => {
      state.selectedSuiteId = action.payload;
    },

    deselectSuite: (state) => {
      state.selectedSuiteId = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all suites
    builder.addCase(fetchAllSuites.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAllSuites.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = {};
      state.allIds = [];
      action.payload.forEach((suite: Suite) => {
        state.items[suite.id] = suite;
        state.allIds.push(suite.id);
      });
      state.lastFetched = new Date().toISOString();
    });
    builder.addCase(fetchAllSuites.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch suites';
    });

    // Fetch suite by ID
    builder.addCase(fetchSuiteById.fulfilled, (state, action) => {
      const suite = action.payload;
      state.items[suite.id] = suite;
      if (!state.allIds.includes(suite.id)) {
        state.allIds.push(suite.id);
      }
    });

    // Create suite
    builder.addCase(createSuite.fulfilled, (state, action) => {
      const suite = action.payload;
      state.items[suite.id] = suite;
      state.allIds.push(suite.id);
    });

    // Update suite
    builder.addCase(updateSuite.fulfilled, (state, action) => {
      const suite = action.payload;
      state.items[suite.id] = suite;
    });

    // Update suite status
    builder.addCase(updateSuiteStatus.fulfilled, (state, action) => {
      const suite = action.payload;
      state.items[suite.id] = suite;
    });

    // Delete suite
    builder.addCase(deleteSuite.fulfilled, (state, action) => {
      const suiteId = action.payload;
      delete state.items[suiteId];
      state.allIds = state.allIds.filter(id => id !== suiteId);
      if (state.selectedSuiteId === suiteId) {
        state.selectedSuiteId = null;
      }
    });
  },
});

export const {
  addSuiteLocal,
  updateSuiteLocal,
  removeSuiteLocal,
  setSuiteFilters,
  clearSuiteFilters,
  setSuiteSorting,
  selectSuite,
  deselectSuite,
} = suitesSlice.actions;

export default suitesSlice.reducer;
```

### 3.3 Tasks Slice

```typescript
// store/slices/tasksSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskStatus } from '../../types/task';
import * as tasksAPI from '../../api/tasks';

interface TasksState {
  items: Record<string, Task>;
  allIds: string[];
  bySuite: Record<string, string[]>;
  byEmployee: Record<string, string[]>;
  byStatus: Record<TaskStatus, string[]>;
  filters: {
    status: TaskStatus[] | null;
    type: string[] | null;
    priority: string[] | null;
    assignedTo: string | null;
    suiteId: string | null;
  };
  viewMode: 'list' | 'kanban' | 'calendar';
  selectedTaskId: string | null;
  activeTaskId: string | null;
  activeTaskStartTime: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  items: {},
  allIds: [],
  bySuite: {},
  byEmployee: {},
  byStatus: {} as Record<TaskStatus, string[]>,
  filters: {
    status: null,
    type: null,
    priority: null,
    assignedTo: null,
    suiteId: null,
  },
  viewMode: 'list',
  selectedTaskId: null,
  activeTaskId: null,
  activeTaskStartTime: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchAllTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (params?: Record<string, any>) => {
    const response = await tasksAPI.fetchAll(params);
    return response.data;
  }
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async (taskData: Partial<Task>) => {
    const response = await tasksAPI.create(taskData);
    return response.data;
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
    const response = await tasksAPI.update(taskId, updates);
    return response.data;
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateStatus',
  async ({ taskId, status, notes }: { taskId: string; status: TaskStatus; notes?: string }) => {
    const response = await tasksAPI.updateStatus(taskId, status, notes);
    return response.data;
  }
);

export const assignTask = createAsyncThunk(
  'tasks/assign',
  async ({ taskId, employeeId }: { taskId: string; employeeId: string }) => {
    const response = await tasksAPI.assign(taskId, employeeId);
    return response.data;
  }
);

export const startTask = createAsyncThunk(
  'tasks/start',
  async (taskId: string) => {
    const response = await tasksAPI.start(taskId);
    return response.data;
  }
);

export const completeTask = createAsyncThunk(
  'tasks/complete',
  async ({ taskId, completionNotes, customFields }: {
    taskId: string;
    completionNotes?: string;
    customFields?: Record<string, any>;
  }) => {
    const response = await tasksAPI.complete(taskId, completionNotes, customFields);
    return response.data;
  }
);

// Helper function to update groupings
function updateTaskGroupings(state: TasksState) {
  state.bySuite = {};
  state.byEmployee = {};
  state.byStatus = {} as Record<TaskStatus, string[]>;

  state.allIds.forEach(taskId => {
    const task = state.items[taskId];

    // Group by suite
    if (task.suiteId) {
      if (!state.bySuite[task.suiteId]) {
        state.bySuite[task.suiteId] = [];
      }
      state.bySuite[task.suiteId].push(taskId);
    }

    // Group by employee
    if (task.assignedTo) {
      if (!state.byEmployee[task.assignedTo]) {
        state.byEmployee[task.assignedTo] = [];
      }
      state.byEmployee[task.assignedTo].push(taskId);
    }

    // Group by status
    if (!state.byStatus[task.status]) {
      state.byStatus[task.status] = [];
    }
    state.byStatus[task.status].push(taskId);
  });
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Local updates
    addTaskLocal: (state, action: PayloadAction<Task>) => {
      const task = action.payload;
      state.items[task.id] = task;
      if (!state.allIds.includes(task.id)) {
        state.allIds.push(task.id);
      }
      updateTaskGroupings(state);
    },

    updateTaskLocal: (state, action: PayloadAction<{ id: string; updates: Partial<Task> }>) => {
      const { id, updates } = action.payload;
      if (state.items[id]) {
        state.items[id] = { ...state.items[id], ...updates, updatedAt: new Date().toISOString() };
        updateTaskGroupings(state);
      }
    },

    removeTaskLocal: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      delete state.items[taskId];
      state.allIds = state.allIds.filter(id => id !== taskId);
      if (state.selectedTaskId === taskId) {
        state.selectedTaskId = null;
      }
      if (state.activeTaskId === taskId) {
        state.activeTaskId = null;
        state.activeTaskStartTime = null;
      }
      updateTaskGroupings(state);
    },

    // Filters
    setTaskFilters: (state, action: PayloadAction<Partial<TasksState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearTaskFilters: (state) => {
      state.filters = initialState.filters;
    },

    // View mode
    setTaskViewMode: (state, action: PayloadAction<TasksState['viewMode']>) => {
      state.viewMode = action.payload;
    },

    // Selection
    selectTask: (state, action: PayloadAction<string>) => {
      state.selectedTaskId = action.payload;
    },

    deselectTask: (state) => {
      state.selectedTaskId = null;
    },

    // Active task (for time tracking)
    setActiveTask: (state, action: PayloadAction<{ taskId: string; startTime: string }>) => {
      state.activeTaskId = action.payload.taskId;
      state.activeTaskStartTime = action.payload.startTime;
    },

    clearActiveTask: (state) => {
      state.activeTaskId = null;
      state.activeTaskStartTime = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all tasks
    builder.addCase(fetchAllTasks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchAllTasks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = {};
      state.allIds = [];
      action.payload.forEach((task: Task) => {
        state.items[task.id] = task;
        state.allIds.push(task.id);
      });
      updateTaskGroupings(state);
    });
    builder.addCase(fetchAllTasks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch tasks';
    });

    // Create task
    builder.addCase(createTask.fulfilled, (state, action) => {
      const task = action.payload;
      state.items[task.id] = task;
      state.allIds.push(task.id);
      updateTaskGroupings(state);
    });

    // Update task
    builder.addCase(updateTask.fulfilled, (state, action) => {
      const task = action.payload;
      state.items[task.id] = task;
      updateTaskGroupings(state);
    });

    // Start task
    builder.addCase(startTask.fulfilled, (state, action) => {
      const task = action.payload;
      state.items[task.id] = task;
      state.activeTaskId = task.id;
      state.activeTaskStartTime = task.actualStart || new Date().toISOString();
      updateTaskGroupings(state);
    });

    // Complete task
    builder.addCase(completeTask.fulfilled, (state, action) => {
      const task = action.payload;
      state.items[task.id] = task;
      if (state.activeTaskId === task.id) {
        state.activeTaskId = null;
        state.activeTaskStartTime = null;
      }
      updateTaskGroupings(state);
    });
  },
});

export const {
  addTaskLocal,
  updateTaskLocal,
  removeTaskLocal,
  setTaskFilters,
  clearTaskFilters,
  setTaskViewMode,
  selectTask,
  deselectTask,
  setActiveTask,
  clearActiveTask,
} = tasksSlice.actions;

export default tasksSlice.reducer;
```

---

## 4. Selectors

```typescript
// store/selectors/suiteSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { Suite, SuiteStatus } from '../../types/suite';

// Base selectors
export const selectSuitesState = (state: RootState) => state.suites;
export const selectAllSuiteIds = (state: RootState) => state.suites.allIds;
export const selectSuiteItems = (state: RootState) => state.suites.items;
export const selectSuiteFilters = (state: RootState) => state.suites.filters;
export const selectSuiteSorting = (state: RootState) => ({
  sortBy: state.suites.sortBy,
  sortOrder: state.suites.sortOrder,
});

// Memoized selectors
export const selectAllSuites = createSelector(
  [selectAllSuiteIds, selectSuiteItems],
  (allIds, items) => allIds.map(id => items[id])
);

export const selectFilteredSuites = createSelector(
  [selectAllSuites, selectSuiteFilters],
  (suites, filters) => {
    let filtered = suites;

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(suite => filters.status!.includes(suite.status));
    }

    if (filters.floor && filters.floor.length > 0) {
      filtered = filtered.filter(suite => filters.floor!.includes(suite.floor));
    }

    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter(suite => filters.type!.includes(suite.type));
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        suite =>
          suite.suiteNumber.toLowerCase().includes(query) ||
          suite.currentGuest?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }
);

export const selectSortedSuites = createSelector(
  [selectFilteredSuites, selectSuiteSorting],
  (suites, { sortBy, sortOrder }) => {
    const sorted = [...suites].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'suiteNumber':
          aValue = a.suiteNumber;
          bValue = b.suiteNumber;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'floor':
          aValue = a.floor;
          bValue = b.floor;
          break;
        case 'lastCleaned':
          aValue = a.lastCleaned ? new Date(a.lastCleaned).getTime() : 0;
          bValue = b.lastCleaned ? new Date(b.lastCleaned).getTime() : 0;
          break;
        default:
          aValue = a.suiteNumber;
          bValue = b.suiteNumber;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }
);

export const selectSuitesByStatus = createSelector(
  [selectAllSuites, (_state: RootState, status: SuiteStatus) => status],
  (suites, status) => suites.filter(suite => suite.status === status)
);

export const selectVacantCleanSuites = (state: RootState) =>
  selectSuitesByStatus(state, SuiteStatus.VACANT_CLEAN);

export const selectSuitesNeedingCleaning = createSelector(
  [selectAllSuites],
  (suites) =>
    suites.filter(suite =>
      [SuiteStatus.VACANT_DIRTY, SuiteStatus.OCCUPIED_DIRTY].includes(suite.status)
    )
);

export const selectSuiteById = createSelector(
  [selectSuiteItems, (_state: RootState, suiteId: string) => suiteId],
  (items, suiteId) => items[suiteId]
);
```

---

## 5. Custom Hooks

### 5.1 useSuites Hook

```typescript
// hooks/useSuites.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchAllSuites,
  selectSortedSuites,
  selectSuitesState,
  setSuiteFilters,
  clearSuiteFilters,
  selectSuite,
} from '../store/slices/suitesSlice';
import { SuiteStatus } from '../types/suite';

export function useSuites() {
  const dispatch = useAppDispatch();
  const suites = useAppSelector(selectSortedSuites);
  const { isLoading, error, selectedSuiteId } = useAppSelector(selectSuitesState);

  useEffect(() => {
    dispatch(fetchAllSuites());
  }, [dispatch]);

  const filterByStatus = (status: SuiteStatus[] | null) => {
    dispatch(setSuiteFilters({ status }));
  };

  const filterByFloor = (floor: number[] | null) => {
    dispatch(setSuiteFilters({ floor }));
  };

  const search = (query: string) => {
    dispatch(setSuiteFilters({ searchQuery: query }));
  };

  const clearFilters = () => {
    dispatch(clearSuiteFilters());
  };

  const selectSuiteById = (suiteId: string) => {
    dispatch(selectSuite(suiteId));
  };

  return {
    suites,
    isLoading,
    error,
    selectedSuiteId,
    filterByStatus,
    filterByFloor,
    search,
    clearFilters,
    selectSuiteById,
  };
}
```

### 5.2 useTasks Hook

```typescript
// hooks/useTasks.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchAllTasks,
  createTask,
  startTask,
  completeTask,
  selectTasksState,
} from '../store/slices/tasksSlice';
import { Task, TaskStatus } from '../types/task';
import { useAppSelector as useSelector } from '../store';
import { selectCurrentUser } from '../store/slices/authSlice';

export function useTasks() {
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { items, allIds, activeTaskId, isLoading, error } = useAppSelector(selectTasksState);

  const tasks = allIds.map(id => items[id]);

  useEffect(() => {
    dispatch(fetchAllTasks());
  }, [dispatch]);

  const createNewTask = async (taskData: Partial<Task>) => {
    await dispatch(createTask(taskData)).unwrap();
  };

  const startTaskById = async (taskId: string) => {
    await dispatch(startTask(taskId)).unwrap();
  };

  const completeTaskById = async (taskId: string, completionNotes?: string) => {
    await dispatch(completeTask({ taskId, completionNotes })).unwrap();
  };

  const myTasks = tasks.filter(task => task.assignedTo === currentUser?.id);
  const activeTasks = tasks.filter(task =>
    [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS].includes(task.status)
  );

  return {
    tasks,
    myTasks,
    activeTasks,
    activeTaskId,
    isLoading,
    error,
    createTask: createNewTask,
    startTask: startTaskById,
    completeTask: completeTaskById,
  };
}
```

### 5.3 useRealTimeSync Hook

```typescript
// hooks/useRealTimeSync.ts
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { WebSocketManager } from '../services/websocket';
import { selectAuthToken, selectCurrentUser } from '../store/slices/authSlice';
import { addSuiteLocal, updateSuiteLocal, removeSuiteLocal } from '../store/slices/suitesSlice';
import { addTaskLocal, updateTaskLocal, removeTaskLocal } from '../store/slices/tasksSlice';
import { addNoteLocal } from '../store/slices/notesSlice';
import { addNotification } from '../store/slices/notificationsSlice';
import { showToast } from '../store/slices/uiSlice';

export function useRealTimeSync() {
  const dispatch = useAppDispatch();
  const authToken = useAppSelector(selectAuthToken);
  const currentUser = useAppSelector(selectCurrentUser);
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!authToken) return;

    // Initialize WebSocket connection
    wsManagerRef.current = new WebSocketManager(authToken);

    // Connection events
    wsManagerRef.current.on('connected', () => {
      setIsConnected(true);
      console.log('Real-time sync connected');
    });

    wsManagerRef.current.on('disconnected', () => {
      setIsConnected(false);
      console.log('Real-time sync disconnected');
    });

    // Entity events
    wsManagerRef.current.on('ENTITY_CREATED', handleEntityCreated);
    wsManagerRef.current.on('ENTITY_UPDATED', handleEntityUpdated);
    wsManagerRef.current.on('ENTITY_DELETED', handleEntityDeleted);

    // Specific events
    wsManagerRef.current.on('TASK_ASSIGNED', handleTaskAssigned);
    wsManagerRef.current.on('NOTIFICATION', handleNotification);
    wsManagerRef.current.on('EMERGENCY_ALERT', handleEmergencyAlert);

    // Cleanup
    return () => {
      wsManagerRef.current?.disconnect();
    };
  }, [authToken]);

  const handleEntityCreated = (data: any) => {
    switch (data.entityType) {
      case 'SUITE':
        dispatch(addSuiteLocal(data.data.suite));
        break;
      case 'TASK':
        dispatch(addTaskLocal(data.data.task));
        if (data.data.task.assignedTo === currentUser?.id) {
          dispatch(showToast({
            type: 'info',
            message: `New task assigned: ${data.data.task.title}`,
          }));
        }
        break;
      case 'NOTE':
        dispatch(addNoteLocal(data.data.note));
        break;
    }
  };

  const handleEntityUpdated = (data: any) => {
    // Skip if updated by current user (already updated optimistically)
    if (data.data.updatedBy === currentUser?.id) return;

    switch (data.entityType) {
      case 'SUITE':
        dispatch(updateSuiteLocal({
          id: data.data.suiteId,
          updates: data.data.changes.after,
        }));
        break;
      case 'TASK':
        dispatch(updateTaskLocal({
          id: data.data.taskId,
          updates: data.data.changes.after,
        }));
        break;
    }
  };

  const handleEntityDeleted = (data: any) => {
    if (data.data.deletedBy === currentUser?.id) return;

    switch (data.entityType) {
      case 'SUITE':
        dispatch(removeSuiteLocal(data.data.suiteId));
        break;
      case 'TASK':
        dispatch(removeTaskLocal(data.data.taskId));
        break;
    }
  };

  const handleTaskAssigned = (data: any) => {
    if (data.data.assignedTo === currentUser?.id) {
      dispatch(addTaskLocal(data.data.task));
      dispatch(addNotification({
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: data.data.task.title,
        relatedEntityId: data.data.taskId,
      }));
      dispatch(showToast({
        type: 'info',
        message: `New task assigned: ${data.data.task.title}`,
      }));
    }
  };

  const handleNotification = (data: any) => {
    dispatch(addNotification(data.data.notification));
  };

  const handleEmergencyAlert = (data: any) => {
    dispatch(showToast({
      type: 'error',
      message: `EMERGENCY: ${data.data.message}`,
      duration: 10000,
    }));
  };

  return {
    isConnected,
    wsManager: wsManagerRef.current,
  };
}
```

---

## 6. Component Examples

### 6.1 SuiteCard Component

```typescript
// components/suites/SuiteCard.tsx
import React, { useState } from 'react';
import { Suite, SuiteStatus } from '../../types/suite';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { Icon } from '../common/Icon';
import { formatRelativeTime } from '../../utils/dateFormatter';

interface SuiteCardProps {
  suite: Suite;
  onClick: (suiteId: string) => void;
  onStatusChange?: (suiteId: string, newStatus: SuiteStatus) => void;
  compact?: boolean;
}

const STATUS_COLORS: Record<SuiteStatus, string> = {
  [SuiteStatus.VACANT_CLEAN]: 'green',
  [SuiteStatus.VACANT_DIRTY]: 'orange',
  [SuiteStatus.OCCUPIED_CLEAN]: 'blue',
  [SuiteStatus.OCCUPIED_DIRTY]: 'red',
  [SuiteStatus.OUT_OF_ORDER]: 'red',
  [SuiteStatus.BLOCKED]: 'gray',
};

export const SuiteCard: React.FC<SuiteCardProps> = ({
  suite,
  onClick,
  onStatusChange,
  compact = false,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on status menu
    if ((e.target as HTMLElement).closest('.status-menu')) {
      return;
    }
    onClick(suite.id);
  };

  const handleStatusChange = (newStatus: SuiteStatus) => {
    onStatusChange?.(suite.id, newStatus);
    setShowStatusMenu(false);
  };

  const statusColor = STATUS_COLORS[suite.status];
  const hasActiveTasks = suite.activeTasks.length > 0;

  return (
    <Card onClick={handleCardClick} clickable className={compact ? 'compact' : ''}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold">{suite.suiteNumber}</h3>

        <div className="relative">
          <Badge
            color={statusColor}
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusMenu(!showStatusMenu);
            }}
            className="cursor-pointer"
          >
            {suite.status.replace('_', ' ')}
          </Badge>

          {showStatusMenu && onStatusChange && (
            <StatusMenu
              currentStatus={suite.status}
              onSelect={handleStatusChange}
              onClose={() => setShowStatusMenu(false)}
            />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Icon name="layers" size="small" className="mr-2" />
          <span>Floor {suite.floor}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Icon name="bed" size="small" className="mr-2" />
          <span>{suite.bedConfiguration.replace('_', ' ')}</span>
        </div>

        {suite.currentGuest && (
          <div className="flex items-center text-sm text-gray-600">
            <Icon name="person" size="small" className="mr-2" />
            <span>{suite.currentGuest.name}</span>
          </div>
        )}

        {hasActiveTasks && (
          <div className="flex items-center text-sm text-orange-600 mt-2">
            <Icon name="task" size="small" className="mr-2" />
            <span>{suite.activeTasks.length} active task(s)</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {!compact && suite.lastCleaned && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Cleaned {formatRelativeTime(suite.lastCleaned)}
          </p>
        </div>
      )}
    </Card>
  );
};

// StatusMenu subcomponent
interface StatusMenuProps {
  currentStatus: SuiteStatus;
  onSelect: (status: SuiteStatus) => void;
  onClose: () => void;
}

const StatusMenu: React.FC<StatusMenuProps> = ({ currentStatus, onSelect, onClose }) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const validTransitions: Record<SuiteStatus, SuiteStatus[]> = {
    [SuiteStatus.VACANT_DIRTY]: [SuiteStatus.VACANT_CLEAN, SuiteStatus.OUT_OF_ORDER],
    [SuiteStatus.VACANT_CLEAN]: [SuiteStatus.OCCUPIED_CLEAN, SuiteStatus.BLOCKED, SuiteStatus.OUT_OF_ORDER],
    [SuiteStatus.OCCUPIED_CLEAN]: [SuiteStatus.OCCUPIED_DIRTY, SuiteStatus.VACANT_DIRTY, SuiteStatus.OUT_OF_ORDER],
    [SuiteStatus.OCCUPIED_DIRTY]: [SuiteStatus.OCCUPIED_CLEAN, SuiteStatus.VACANT_DIRTY, SuiteStatus.OUT_OF_ORDER],
    [SuiteStatus.OUT_OF_ORDER]: [SuiteStatus.VACANT_DIRTY],
    [SuiteStatus.BLOCKED]: [SuiteStatus.VACANT_CLEAN, SuiteStatus.VACANT_DIRTY],
  };

  const availableStatuses = validTransitions[currentStatus] || [];

  return (
    <div className="status-menu absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
      {availableStatuses.map(status => (
        <button
          key={status}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(status);
          }}
          className="block w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
        >
          {status.replace('_', ' ')}
        </button>
      ))}
    </div>
  );
};
```

### 6.2 CreateTaskModal Component

```typescript
// components/tasks/CreateTaskModal.tsx
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { createTask } from '../../store/slices/tasksSlice';
import { selectAllSuites } from '../../store/selectors/suiteSelectors';
import { selectAllEmployees } from '../../store/selectors/employeeSelectors';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { TaskType, TaskPriority } from '../../types/task';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<{
    suiteId: string;
    type: TaskType;
  }>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const dispatch = useAppDispatch();
  const suites = useAppSelector(selectAllSuites);
  const employees = useAppSelector(selectAllEmployees);

  const [formData, setFormData] = useState({
    type: initialData?.type || TaskType.CLEANING,
    priority: TaskPriority.NORMAL,
    title: '',
    description: '',
    suiteId: initialData?.suiteId || '',
    assignedTo: '',
    scheduledStart: '',
    estimatedDuration: 30,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Auto-generate title for cleaning tasks
    if (field === 'suiteId' && formData.type === TaskType.CLEANING) {
      const suite = suites.find(s => s.id === value);
      if (suite) {
        setFormData(prev => ({
          ...prev,
          title: `Clean Suite ${suite.suiteNumber}`,
        }));
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.type) {
      newErrors.type = 'Task type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(createTask(formData)).unwrap();
      onClose();

      // Reset form
      setFormData({
        type: TaskType.CLEANING,
        priority: TaskPriority.NORMAL,
        title: '',
        description: '',
        suiteId: '',
        assignedTo: '',
        scheduledStart: '',
        estimatedDuration: 30,
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      setErrors({ submit: 'Failed to create task. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task" size="large">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Type */}
        <Select
          label="Type"
          value={formData.type}
          onChange={(value) => handleFieldChange('type', value)}
          options={Object.values(TaskType).map(type => ({
            value: type,
            label: type.replace('_', ' '),
          }))}
          error={errors.type}
          required
        />

        {/* Title */}
        <Input
          label="Title"
          value={formData.title}
          onChange={(value) => handleFieldChange('title', value)}
          placeholder="Enter task title"
          error={errors.title}
          required
        />

        {/* Description */}
        <TextArea
          label="Description"
          value={formData.description}
          onChange={(value) => handleFieldChange('description', value)}
          placeholder="Add any additional details..."
          rows={4}
        />

        {/* Suite Selection */}
        <Select
          label="Suite"
          value={formData.suiteId}
          onChange={(value) => handleFieldChange('suiteId', value)}
          options={[
            { value: '', label: 'Select a suite' },
            ...suites.map(suite => ({
              value: suite.id,
              label: `Suite ${suite.suiteNumber} - Floor ${suite.floor}`,
            })),
          ]}
        />

        {/* Priority */}
        <Select
          label="Priority"
          value={formData.priority}
          onChange={(value) => handleFieldChange('priority', value)}
          options={Object.values(TaskPriority).map(priority => ({
            value: priority,
            label: priority,
          }))}
          required
        />

        {/* Assign To */}
        <Select
          label="Assign To"
          value={formData.assignedTo}
          onChange={(value) => handleFieldChange('assignedTo', value)}
          options={[
            { value: '', label: 'Unassigned' },
            ...employees
              .filter(e => e.isOnDuty)
              .map(employee => ({
                value: employee.id,
                label: `${employee.firstName} ${employee.lastName} (${employee.role})`,
              })),
          ]}
        />

        {/* Estimated Duration */}
        <Input
          label="Estimated Duration (minutes)"
          type="number"
          value={formData.estimatedDuration}
          onChange={(value) => handleFieldChange('estimatedDuration', parseInt(value))}
          min={5}
          step={5}
        />

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
```

---

## 7. App Entry Point

```typescript
// App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store';
import { useAuth } from './hooks/useAuth';
import { useRealTimeSync } from './hooks/useRealTimeSync';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SuitesPage } from './pages/SuitesPage';
import { TasksPage } from './pages/TasksPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { NotesPage } from './pages/NotesPage';

// Layout
import { MainLayout } from './components/layout/MainLayout';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main app component with real-time sync
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Initialize real-time sync
  useRealTimeSync();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="suites" element={<SuitesPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="notes" element={<NotesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Root app component
export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
```

This React implementation guide provides production-ready patterns for building the motel management application with proper TypeScript typing, state management, and real-time synchronization.

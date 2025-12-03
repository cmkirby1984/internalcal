// State types for Zustand stores matching pseudo-code 02-state-management.md
import {
  SuiteStatus,
  SuiteType,
  SuiteSortBy,
  SortOrder,
  TaskStatus,
  TaskType,
  TaskPriority,
  TaskViewMode,
  EmployeeStatus,
  EmployeeRole,
  Department,
  NoteType,
  NotePriority,
  ViewType,
  Theme,
  ToastType,
  TasksViewDensity,
  SyncOperation,
} from './enums';
import type { Suite, Task, Employee, Note, Notification } from './entities';

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZED ENTITY MAPS
// ─────────────────────────────────────────────────────────────────────────────

export type EntityMap<T> = Record<string, T>;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthState {
  currentUser: Employee | null;
  isAuthenticated: boolean;
  token: string | null;
  permissions: string[];
  lastActivity: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateLastActivity: () => void;
  checkPermission: (permission: string) => boolean;
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITES STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface SuiteFilters {
  status: SuiteStatus[] | null;
  floor: number[] | null;
  type: SuiteType[] | null;
  searchQuery: string;
}

export interface SuitesState {
  items: EntityMap<Suite>;
  allIds: string[];
  filters: SuiteFilters;
  sortBy: SuiteSortBy;
  sortOrder: SortOrder;
  selectedSuiteId: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  needsRefresh: boolean;
}

export interface SuitesActions {
  // Fetch operations
  fetchAllSuites: () => Promise<void>;
  fetchSuiteById: (suiteId: string) => Promise<void>;
  
  // CRUD operations
  createSuite: (suiteData: Partial<Suite>) => Promise<Suite>;
  updateSuite: (suiteId: string, updates: Partial<Suite>) => Promise<void>;
  updateSuiteStatus: (suiteId: string, newStatus: SuiteStatus) => Promise<void>;
  deleteSuite: (suiteId: string) => Promise<void>;
  
  // Local state updates
  normalizeSuites: (suites: Suite[]) => void;
  addSuite: (suite: Suite) => void;
  updateSuiteLocal: (suiteId: string, updates: Partial<Suite>) => void;
  removeSuite: (suiteId: string) => void;
  
  // Filtering & Sorting
  setSuiteFilters: (filters: Partial<SuiteFilters>) => void;
  clearSuiteFilters: () => void;
  setSuiteSorting: (sortBy: SuiteSortBy, sortOrder: SortOrder) => void;
  
  // Selection
  selectSuite: (suiteId: string | null) => void;
  
  // Cache management
  setNeedsRefresh: (needsRefresh: boolean) => void;
  clearError: () => void;
  
  // Business logic helpers
  handleSuiteStatusChange: (suiteId: string, oldStatus: SuiteStatus | undefined, newStatus: SuiteStatus) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// TASKS STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface TaskFilters {
  status: TaskStatus[] | null;
  type: TaskType[] | null;
  priority: TaskPriority[] | null;
  assignedTo: string | null;
  suiteId: string | null;
  dateRange: { start: string; end: string } | null;
}

export interface TasksState {
  items: EntityMap<Task>;
  allIds: string[];
  
  // Grouped views for performance
  bySuite: Record<string, string[]>;
  byEmployee: Record<string, string[]>;
  byStatus: Record<TaskStatus, string[]>;
  byPriority: Record<TaskPriority, string[]>;
  
  filters: TaskFilters;
  viewMode: TaskViewMode;
  selectedTaskId: string | null;
  
  // Active task for time tracking
  activeTaskId: string | null;
  activeTaskStartTime: string | null;
  
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

export interface TasksActions {
  // Fetch operations
  fetchAllTasks: (options?: Record<string, unknown>) => Promise<void>;
  fetchTasksBySuite: (suiteId: string) => Promise<void>;
  fetchTasksByEmployee: (employeeId: string) => Promise<void>;
  
  // CRUD operations
  createTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Status transitions
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  assignTask: (taskId: string, employeeId: string) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, completionNotes?: string) => Promise<void>;
  
  // Local state updates
  normalizeTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTaskLocal: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  updateTaskGroupings: () => void;
  
  // Filtering & View
  setTaskFilters: (filters: Partial<TaskFilters>) => void;
  clearTaskFilters: () => void;
  setTaskViewMode: (viewMode: TaskViewMode) => void;
  
  // Selection
  selectTask: (taskId: string | null) => void;
  
  clearError: () => void;
  
  // Business logic helpers
  handleTaskStatusChange: (taskId: string, oldStatus: TaskStatus | undefined, newStatus: TaskStatus) => void;
  handleTaskReassignment: (taskId: string, oldEmployeeId: string | null | undefined, newEmployeeId: string) => void;
  applyTaskCompletionRules: (task: Task) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEES STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface EmployeeFilters {
  status: EmployeeStatus[] | null;
  role: EmployeeRole[] | null;
  department: Department[] | null;
}

export interface EmployeesState {
  items: EntityMap<Employee>;
  allIds: string[];
  
  // Filtered views
  onDuty: string[];
  available: string[];
  byDepartment: Record<Department, string[]>;
  byRole: Record<EmployeeRole, string[]>;
  
  filters: EmployeeFilters;
  selectedEmployeeId: string | null;
  
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

export interface EmployeesActions {
  // Fetch operations
  fetchAllEmployees: () => Promise<void>;
  fetchEmployeeById: (employeeId: string) => Promise<void>;
  
  // CRUD operations
  createEmployee: (employeeData: Partial<Employee>) => Promise<Employee>;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  
  // Clock in/out
  clockIn: (employeeId: string) => Promise<void>;
  clockOut: (employeeId: string) => Promise<void>;
  
  // Local state updates
  normalizeEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployeeLocal: (employeeId: string, updates: Partial<Employee>) => void;
  removeEmployee: (employeeId: string) => void;
  updateEmployeeGroupings: () => void;
  
  // Filtering
  setEmployeeFilters: (filters: Partial<EmployeeFilters>) => void;
  clearEmployeeFilters: () => void;
  
  // Selection
  selectEmployee: (employeeId: string | null) => void;
  
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTES STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface NoteFilters {
  type: NoteType[] | null;
  priority: NotePriority[] | null;
  relatedSuite: string | null;
  relatedTask: string | null;
  showArchived: boolean;
  dateRange: { start: string; end: string } | null;
}

export interface NotesState {
  items: EntityMap<Note>;
  allIds: string[];
  
  // Grouped views
  bySuite: Record<string, string[]>;
  byTask: Record<string, string[]>;
  pinned: string[];
  
  filters: NoteFilters;
  selectedNoteId: string | null;
  
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

export interface NotesActions {
  // Fetch operations
  fetchAllNotes: (options?: Record<string, unknown>) => Promise<void>;
  fetchNotesBySuite: (suiteId: string) => Promise<void>;
  fetchNotesByTask: (taskId: string) => Promise<void>;
  
  // CRUD operations
  createNote: (noteData: Partial<Note>) => Promise<Note>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  
  // Pin/Archive
  togglePinNote: (noteId: string) => Promise<void>;
  archiveNote: (noteId: string) => Promise<void>;
  
  // Comments
  addComment: (noteId: string, commentText: string) => Promise<void>;
  
  // Read receipts
  markNoteAsRead: (noteId: string) => Promise<void>;
  
  // Local state updates
  normalizeNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNoteLocal: (noteId: string, updates: Partial<Note>) => void;
  removeNote: (noteId: string) => void;
  updateNoteGroupings: () => void;
  
  // Filtering
  setNoteFilters: (filters: Partial<NoteFilters>) => void;
  clearNoteFilters: () => void;
  
  // Selection
  selectNote: (noteId: string | null) => void;
  
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationsState {
  items: EntityMap<Notification>;
  allIds: string[];
  unreadCount: number;
  unreadIds: string[];
  
  isLoading: boolean;
  error: string | null;
}

export interface NotificationsActions {
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  // Local updates
  addNotification: (notification: Notification) => void;
  updateNotificationLocal: (notificationId: string, updates: Partial<Notification>) => void;
  removeNotification: (notificationId: string) => void;
  recalculateUnread: () => void;
  
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  type: ToastType | 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  duration?: number;
}

export interface UIState {
  currentView: ViewType;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  isMobileView: boolean;
  bottomSheetOpen: boolean;
  theme: Theme;
  suitesGridColumns: number;
  tasksViewDensity: TasksViewDensity;
  toasts: Toast[];
}

export interface UIActions {
  setCurrentView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (modalName: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  setMobileView: (isMobile: boolean) => void;
  toggleBottomSheet: () => void;
  setTheme: (theme: Theme) => void;
  updateLayoutPreference: (key: string, value: unknown) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (toastId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC STATE (Offline support)
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingChange {
  id: string;
  entityType: string;
  entityId: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface SyncState {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingChanges: PendingChange[];
  syncInProgress: boolean;
  syncError: string | null;
}

export interface SyncActions {
  setOnline: (isOnline: boolean) => void;
  addPendingChange: (change: Omit<PendingChange, 'id' | 'timestamp'>) => void;
  removePendingChange: (changeId: string) => void;
  syncPendingChanges: () => Promise<void>;
  clearPendingChanges: () => void;
  setSyncError: (error: string | null) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CACHE STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalSuites: number;
  vacantClean: number;
  needsCleaning: number;
  outOfOrder: number;
  occupancyRate: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedToday: number;
  overdueTasks: number;
  employeesOnDuty: number;
  availableEmployees: number;
}

export interface CacheState {
  dashboardStats: DashboardStats | null;
  recentActivity: Record<string, unknown>[];
  quickAccessSuites: string[];
  lastFetchedTimestamps: Record<string, string>;
}

export interface CacheActions {
  setDashboardStats: (stats: DashboardStats) => void;
  addRecentActivity: (activity: Record<string, unknown>) => void;
  setQuickAccessSuites: (suiteIds: string[]) => void;
  updateLastFetched: (key: string) => void;
  clearCache: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED STORE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AuthStore = AuthState & AuthActions;
export type SuitesStore = SuitesState & SuitesActions;
export type TasksStore = TasksState & TasksActions;
export type EmployeesStore = EmployeesState & EmployeesActions;
export type NotesStore = NotesState & NotesActions;
export type NotificationsStore = NotificationsState & NotificationsActions;
export type UIStore = UIState & UIActions;
export type SyncStore = SyncState & SyncActions;
export type CacheStore = CacheState & CacheActions;


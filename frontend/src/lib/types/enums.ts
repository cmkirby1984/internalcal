// Enums matching backend Prisma schema

export enum SuiteType {
  STANDARD = 'STANDARD',
  DELUXE = 'DELUXE',
  SUITE = 'SUITE',
  ACCESSIBLE = 'ACCESSIBLE',
}

export enum SuiteStatus {
  VACANT_CLEAN = 'VACANT_CLEAN',
  VACANT_DIRTY = 'VACANT_DIRTY',
  OCCUPIED_CLEAN = 'OCCUPIED_CLEAN',
  OCCUPIED_DIRTY = 'OCCUPIED_DIRTY',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
  BLOCKED = 'BLOCKED',
}

export enum BedConfiguration {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  QUEEN = 'QUEEN',
  KING = 'KING',
  TWIN_BEDS = 'TWIN_BEDS',
  QUEEN_PLUS_SOFA = 'QUEEN_PLUS_SOFA',
}

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

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum EmployeeRole {
  HOUSEKEEPER = 'HOUSEKEEPER',
  MAINTENANCE = 'MAINTENANCE',
  FRONT_DESK = 'FRONT_DESK',
  SUPERVISOR = 'SUPERVISOR',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum Department {
  HOUSEKEEPING = 'HOUSEKEEPING',
  MAINTENANCE = 'MAINTENANCE',
  FRONT_OFFICE = 'FRONT_OFFICE',
  MANAGEMENT = 'MANAGEMENT',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_BREAK = 'ON_BREAK',
  OFF_DUTY = 'OFF_DUTY',
  ON_LEAVE = 'ON_LEAVE',
  INACTIVE = 'INACTIVE',
}

export enum ShiftType {
  DAY = 'DAY',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

export enum ContactMethod {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PHONE = 'PHONE',
  IN_APP = 'IN_APP',
}

export enum NoteType {
  GENERAL = 'GENERAL',
  MAINTENANCE = 'MAINTENANCE',
  GUEST_REQUEST = 'GUEST_REQUEST',
  INCIDENT = 'INCIDENT',
  REMINDER = 'REMINDER',
  HANDOFF = 'HANDOFF',
}

export enum NotePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NoteVisibility {
  PRIVATE = 'PRIVATE',
  DEPARTMENT = 'DEPARTMENT',
  ALL_STAFF = 'ALL_STAFF',
  MANAGERS_ONLY = 'MANAGERS_ONLY',
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  SUITE_STATUS_CHANGE = 'SUITE_STATUS_CHANGE',
  EMERGENCY_TASK = 'EMERGENCY_TASK',
  SHIFT_REMINDER = 'SHIFT_REMINDER',
  NOTE_MENTION = 'NOTE_MENTION',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

// UI-specific enums
export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  SUITES = 'SUITES',
  TASKS = 'TASKS',
  EMPLOYEES = 'EMPLOYEES',
  NOTES = 'NOTES',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
}

export enum TaskViewMode {
  LIST = 'LIST',
  KANBAN = 'KANBAN',
  CALENDAR = 'CALENDAR',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum SuiteSortBy {
  SUITE_NUMBER = 'SUITE_NUMBER',
  STATUS = 'STATUS',
  FLOOR = 'FLOOR',
  LAST_CLEANED = 'LAST_CLEANED',
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  AUTO = 'AUTO',
}

export enum ToastType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export enum TasksViewDensity {
  COMPACT = 'COMPACT',
  COMFORTABLE = 'COMFORTABLE',
  SPACIOUS = 'SPACIOUS',
}

export enum SyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}


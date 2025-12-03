// Entity types matching backend Prisma schema
import {
  SuiteType,
  SuiteStatus,
  BedConfiguration,
  TaskType,
  TaskPriority,
  TaskStatus,
  RecurrenceFrequency,
  EmployeeRole,
  Department,
  EmployeeStatus,
  ShiftType,
  ContactMethod,
  NoteType,
  NotePriority,
  NoteVisibility,
  NotificationType,
} from './enums';

// ─────────────────────────────────────────────────────────────────────────────
// EMBEDDED TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface GuestInfo {
  name: string;
  checkIn: string;
  checkOut: string;
  phone?: string;
  email?: string;
  specialRequests?: string[];
}

export interface ShiftInfo {
  type: ShiftType;
  startTime: string;
  endTime: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
}

export interface PartUsed {
  partNumber: string;
  description: string;
  quantity: number;
  unitCost: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTITIES
// ─────────────────────────────────────────────────────────────────────────────

export interface Suite {
  id: string;
  suiteNumber: string;
  floor: number;
  type: SuiteType;
  status: SuiteStatus;
  currentGuest: GuestInfo | null;
  bedConfiguration: BedConfiguration;
  amenities: string[];
  squareFeet: number | null;
  lastCleaned: string | null;
  lastInspected: string | null;
  nextScheduledMaintenance: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
  description: string | null;
  assignedToId: string | null;
  assignedById: string | null;
  suiteId: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  estimatedDuration: number | null;
  actualStart: string | null;
  actualEnd: string | null;
  actualDuration: number | null;
  completionNotes: string | null;
  verifiedById: string | null;
  verificationNotes: string | null;
  customFields: Record<string, unknown> | null;
  recurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  attachedPhotos: string[];
  parentTaskId: string | null;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: EmployeeRole;
  department: Department;
  status: EmployeeStatus;
  username: string;
  permissions: string[];
  currentShift: ShiftInfo | null;
  isOnDuty: boolean;
  lastClockIn: string | null;
  lastClockOut: string | null;
  currentLocation: string | null;
  tasksCompleted: number;
  averageTaskDuration: number | null;
  performanceRating: number | null;
  preferredContactMethod: ContactMethod;
  emergencyContact: EmergencyContact | null;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
  lastActive: string | null;
}

export interface Note {
  id: string;
  type: NoteType;
  priority: NotePriority;
  title: string | null;
  content: string;
  createdById: string;
  relatedSuiteId: string | null;
  relatedTaskId: string | null;
  relatedEmployeeId: string | null;
  visibility: NoteVisibility;
  pinned: boolean;
  archived: boolean;
  tags: string[];
  requiresFollowUp: boolean;
  followUpDate: string | null;
  followUpAssignedToId: string | null;
  followUpCompleted: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: NoteAttachment[];
  comments?: NoteComment[];
  readReceipts?: NoteReadReceipt[];
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
}

export interface NoteComment {
  id: string;
  noteId: string;
  commentById: string;
  text: string;
  createdAt: string;
}

export interface NoteReadReceipt {
  id: string;
  noteId: string;
  employeeId: string;
  readAt: string;
}

export interface MaintenanceRecord {
  id: string;
  suiteId: string;
  taskId: string | null;
  maintenanceType: string;
  description: string;
  performedById: string;
  performedAt: string;
  partsUsed: PartUsed[] | null;
  totalCost: number | null;
  warrantyInfo: string | null;
  nextScheduledService: string | null;
  beforePhotos: string[];
  afterPhotos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotePriority;
  read: boolean;
  readAt: string | null;
  actionRequired: boolean;
  actionUrl: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: Employee;
  token: string;
}

export interface TokenPayload {
  sub: string;
  username: string;
  role: EmployeeRole;
  permissions: string[];
  iat: number;
  exp: number;
}


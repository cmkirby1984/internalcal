// UI-friendly types that extend or simplify the base entity types
// These are used for display purposes in the frontend

import {
  SuiteType,
  SuiteStatus,
  TaskType,
  TaskPriority,
  TaskStatus,
  EmployeeRole,
  EmployeeStatus,
  NoteType,
  NotePriority,
} from './enums';

/**
 * UI-friendly Suite type with simplified fields
 */
export interface UISuite {
  id: string;
  suiteNumber: string;
  floor: number;
  type: SuiteType;
  status: SuiteStatus;
  bedConfiguration: string;
  amenities: string[];
  maxOccupancy: number;
  currentGuest: {
    name: string;
    checkIn: string;
    checkOut: string;
  } | null;
  lastCleaned: string | null;
  activeTasks: string[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * UI-friendly Task type with simplified fields
 */
export interface UITask {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
  description: string | null;
  suiteId: string | null;
  assignedTo: string | null;
  createdBy: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  notes: string[];
  checklist: { item: string; completed: boolean }[];
  createdAt: string;
  updatedAt: string;
}

/**
 * UI-friendly Employee type with simplified fields
 */
export interface UIEmployee {
  id: string;
  email: string;
  fullName: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  phone: string | null;
  avatar: string | null;
  hireDate: string;
  isOnDuty: boolean;
  lastClockIn: string | null;
  lastClockOut: string | null;
  activeTasks?: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * UI-friendly Note type with simplified fields
 */
export interface UINote {
  id: string;
  type: NoteType;
  priority: NotePriority;
  title: string | null;
  content: string;
  createdBy: string;
  pinned: boolean;
  archived: boolean;
  relatedSuite: string | null;
  relatedTask: string | null;
  relatedEmployee: string | null;
  tags: string[];
  requiresFollowUp: boolean;
  followUpDate: string | null;
  comments: { id: string; text: string; author: string; createdAt: string }[];
  lastReadBy: { employeeId: string; readAt: string }[];
  createdAt: string;
  updatedAt: string;
}


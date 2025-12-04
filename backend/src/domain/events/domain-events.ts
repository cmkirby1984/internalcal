import {
  SuiteStatus,
  TaskStatus,
  TaskType,
  TaskPriority,
} from '@prisma/client';

/**
 * Domain Events
 * These events are emitted when significant business actions occur.
 * Listeners can react to these events to trigger side effects.
 */

// Base event interface
export interface DomainEvent {
  timestamp: Date;
  correlationId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export class SuiteStatusChangedEvent implements DomainEvent {
  static readonly eventName = 'suite.status.changed';
  timestamp = new Date();

  constructor(
    public readonly suiteId: string,
    public readonly suiteNumber: string,
    public readonly previousStatus: SuiteStatus,
    public readonly newStatus: SuiteStatus,
    public readonly changedBy?: string,
    public readonly correlationId?: string,
  ) {}
}

export class SuiteCheckedInEvent implements DomainEvent {
  static readonly eventName = 'suite.checked.in';
  timestamp = new Date();

  constructor(
    public readonly suiteId: string,
    public readonly suiteNumber: string,
    public readonly guestName?: string,
    public readonly checkInDate?: Date,
    public readonly checkOutDate?: Date,
    public readonly correlationId?: string,
  ) {}
}

export class SuiteCheckedOutEvent implements DomainEvent {
  static readonly eventName = 'suite.checked.out';
  timestamp = new Date();

  constructor(
    public readonly suiteId: string,
    public readonly suiteNumber: string,
    public readonly correlationId?: string,
  ) {}
}

export class SuiteOutOfOrderEvent implements DomainEvent {
  static readonly eventName = 'suite.out.of.order';
  timestamp = new Date();

  constructor(
    public readonly suiteId: string,
    public readonly suiteNumber: string,
    public readonly reason?: string,
    public readonly correlationId?: string,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export class TaskCreatedEvent implements DomainEvent {
  static readonly eventName = 'task.created';
  timestamp = new Date();

  constructor(
    public readonly taskId: string,
    public readonly title: string,
    public readonly type: TaskType,
    public readonly priority: TaskPriority,
    public readonly suiteId?: string,
    public readonly suiteNumber?: string,
    public readonly assignedToId?: string,
    public readonly createdById?: string,
    public readonly correlationId?: string,
  ) {}
}

export class TaskAssignedEvent implements DomainEvent {
  static readonly eventName = 'task.assigned';
  timestamp = new Date();

  constructor(
    public readonly taskId: string,
    public readonly title: string,
    public readonly assignedToId: string,
    public readonly assignedToName: string,
    public readonly assignedById?: string,
    public readonly previousAssigneeId?: string,
    public readonly correlationId?: string,
  ) {}
}

export class TaskStatusChangedEvent implements DomainEvent {
  static readonly eventName = 'task.status.changed';
  timestamp = new Date();

  constructor(
    public readonly taskId: string,
    public readonly title: string,
    public readonly previousStatus: TaskStatus,
    public readonly newStatus: TaskStatus,
    public readonly suiteId?: string,
    public readonly changedById?: string,
    public readonly correlationId?: string,
  ) {}
}

export class TaskCompletedEvent implements DomainEvent {
  static readonly eventName = 'task.completed';
  timestamp = new Date();

  constructor(
    public readonly taskId: string,
    public readonly title: string,
    public readonly type: TaskType,
    public readonly suiteId?: string,
    public readonly suiteNumber?: string,
    public readonly completedById?: string,
    public readonly duration?: number, // minutes
    public readonly correlationId?: string,
  ) {}
}

export class TaskVerifiedEvent implements DomainEvent {
  static readonly eventName = 'task.verified';
  timestamp = new Date();

  constructor(
    public readonly taskId: string,
    public readonly title: string,
    public readonly verifiedById: string,
    public readonly correlationId?: string,
  ) {}
}

export class EmergencyTaskCreatedEvent implements DomainEvent {
  static readonly eventName = 'task.emergency.created';
  timestamp = new Date();

  constructor(
    public readonly taskId: string,
    public readonly title: string,
    public readonly suiteId?: string,
    public readonly suiteNumber?: string,
    public readonly description?: string,
    public readonly createdById?: string,
    public readonly correlationId?: string,
  ) {}
}

export class TaskOverdueEvent implements DomainEvent {
  static readonly eventName = 'task.overdue';
  timestamp = new Date();

  constructor(
    public readonly taskId: string,
    public readonly title: string,
    public readonly scheduledEnd: Date,
    public readonly assignedToId?: string,
    public readonly correlationId?: string,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export class EmployeeClockInEvent implements DomainEvent {
  static readonly eventName = 'employee.clock.in';
  timestamp = new Date();

  constructor(
    public readonly employeeId: string,
    public readonly employeeName: string,
    public readonly correlationId?: string,
  ) {}
}

export class EmployeeClockOutEvent implements DomainEvent {
  static readonly eventName = 'employee.clock.out';
  timestamp = new Date();

  constructor(
    public readonly employeeId: string,
    public readonly employeeName: string,
    public readonly activeTaskIds?: string[],
    public readonly correlationId?: string,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export class IncidentNoteCreatedEvent implements DomainEvent {
  static readonly eventName = 'note.incident.created';
  timestamp = new Date();

  constructor(
    public readonly noteId: string,
    public readonly title: string | undefined,
    public readonly content: string,
    public readonly createdById: string,
    public readonly suiteId?: string,
    public readonly correlationId?: string,
  ) {}
}

export class NoteFollowUpDueEvent implements DomainEvent {
  static readonly eventName = 'note.followup.due';
  timestamp = new Date();

  constructor(
    public readonly noteId: string,
    public readonly title: string | undefined,
    public readonly followUpDate: Date,
    public readonly assignedToId?: string,
    public readonly correlationId?: string,
  ) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT NAMES ENUM
// ─────────────────────────────────────────────────────────────────────────────

export const DomainEventNames = {
  // Suite events
  SUITE_STATUS_CHANGED: SuiteStatusChangedEvent.eventName,
  SUITE_CHECKED_IN: SuiteCheckedInEvent.eventName,
  SUITE_CHECKED_OUT: SuiteCheckedOutEvent.eventName,
  SUITE_OUT_OF_ORDER: SuiteOutOfOrderEvent.eventName,

  // Task events
  TASK_CREATED: TaskCreatedEvent.eventName,
  TASK_ASSIGNED: TaskAssignedEvent.eventName,
  TASK_STATUS_CHANGED: TaskStatusChangedEvent.eventName,
  TASK_COMPLETED: TaskCompletedEvent.eventName,
  TASK_VERIFIED: TaskVerifiedEvent.eventName,
  TASK_EMERGENCY_CREATED: EmergencyTaskCreatedEvent.eventName,
  TASK_OVERDUE: TaskOverdueEvent.eventName,

  // Employee events
  EMPLOYEE_CLOCK_IN: EmployeeClockInEvent.eventName,
  EMPLOYEE_CLOCK_OUT: EmployeeClockOutEvent.eventName,

  // Note events
  NOTE_INCIDENT_CREATED: IncidentNoteCreatedEvent.eventName,
  NOTE_FOLLOWUP_DUE: NoteFollowUpDueEvent.eventName,
} as const;

import { SuiteStatus, TaskStatus, TaskType, TaskPriority } from '@prisma/client';
export interface DomainEvent {
    timestamp: Date;
    correlationId?: string;
}
export declare class SuiteStatusChangedEvent implements DomainEvent {
    readonly suiteId: string;
    readonly suiteNumber: string;
    readonly previousStatus: SuiteStatus;
    readonly newStatus: SuiteStatus;
    readonly changedBy?: string | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "suite.status.changed";
    timestamp: Date;
    constructor(suiteId: string, suiteNumber: string, previousStatus: SuiteStatus, newStatus: SuiteStatus, changedBy?: string | undefined, correlationId?: string | undefined);
}
export declare class SuiteCheckedInEvent implements DomainEvent {
    readonly suiteId: string;
    readonly suiteNumber: string;
    readonly guestName?: string | undefined;
    readonly checkInDate?: Date | undefined;
    readonly checkOutDate?: Date | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "suite.checked.in";
    timestamp: Date;
    constructor(suiteId: string, suiteNumber: string, guestName?: string | undefined, checkInDate?: Date | undefined, checkOutDate?: Date | undefined, correlationId?: string | undefined);
}
export declare class SuiteCheckedOutEvent implements DomainEvent {
    readonly suiteId: string;
    readonly suiteNumber: string;
    readonly correlationId?: string | undefined;
    static readonly eventName = "suite.checked.out";
    timestamp: Date;
    constructor(suiteId: string, suiteNumber: string, correlationId?: string | undefined);
}
export declare class SuiteOutOfOrderEvent implements DomainEvent {
    readonly suiteId: string;
    readonly suiteNumber: string;
    readonly reason?: string | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "suite.out.of.order";
    timestamp: Date;
    constructor(suiteId: string, suiteNumber: string, reason?: string | undefined, correlationId?: string | undefined);
}
export declare class TaskCreatedEvent implements DomainEvent {
    readonly taskId: string;
    readonly title: string;
    readonly type: TaskType;
    readonly priority: TaskPriority;
    readonly suiteId?: string | undefined;
    readonly suiteNumber?: string | undefined;
    readonly assignedToId?: string | undefined;
    readonly createdById?: string | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "task.created";
    timestamp: Date;
    constructor(taskId: string, title: string, type: TaskType, priority: TaskPriority, suiteId?: string | undefined, suiteNumber?: string | undefined, assignedToId?: string | undefined, createdById?: string | undefined, correlationId?: string | undefined);
}
export declare class TaskAssignedEvent implements DomainEvent {
    readonly taskId: string;
    readonly title: string;
    readonly assignedToId: string;
    readonly assignedToName: string;
    readonly assignedById?: string | undefined;
    readonly previousAssigneeId?: string | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "task.assigned";
    timestamp: Date;
    constructor(taskId: string, title: string, assignedToId: string, assignedToName: string, assignedById?: string | undefined, previousAssigneeId?: string | undefined, correlationId?: string | undefined);
}
export declare class TaskStatusChangedEvent implements DomainEvent {
    readonly taskId: string;
    readonly title: string;
    readonly previousStatus: TaskStatus;
    readonly newStatus: TaskStatus;
    readonly suiteId?: string | undefined;
    readonly changedById?: string | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "task.status.changed";
    timestamp: Date;
    constructor(taskId: string, title: string, previousStatus: TaskStatus, newStatus: TaskStatus, suiteId?: string | undefined, changedById?: string | undefined, correlationId?: string | undefined);
}
export declare class TaskCompletedEvent implements DomainEvent {
    readonly taskId: string;
    readonly title: string;
    readonly type: TaskType;
    readonly suiteId?: string | undefined;
    readonly suiteNumber?: string | undefined;
    readonly completedById?: string | undefined;
    readonly duration?: number | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "task.completed";
    timestamp: Date;
    constructor(taskId: string, title: string, type: TaskType, suiteId?: string | undefined, suiteNumber?: string | undefined, completedById?: string | undefined, duration?: number | undefined, correlationId?: string | undefined);
}
export declare class TaskVerifiedEvent implements DomainEvent {
    readonly taskId: string;
    readonly title: string;
    readonly verifiedById: string;
    readonly correlationId?: string | undefined;
    static readonly eventName = "task.verified";
    timestamp: Date;
    constructor(taskId: string, title: string, verifiedById: string, correlationId?: string | undefined);
}
export declare class EmergencyTaskCreatedEvent implements DomainEvent {
    readonly taskId: string;
    readonly title: string;
    readonly suiteId?: string | undefined;
    readonly suiteNumber?: string | undefined;
    readonly description?: string | undefined;
    readonly createdById?: string | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "task.emergency.created";
    timestamp: Date;
    constructor(taskId: string, title: string, suiteId?: string | undefined, suiteNumber?: string | undefined, description?: string | undefined, createdById?: string | undefined, correlationId?: string | undefined);
}
export declare class TaskOverdueEvent implements DomainEvent {
    readonly taskId: string;
    readonly title: string;
    readonly scheduledEnd: Date;
    readonly assignedToId?: string | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "task.overdue";
    timestamp: Date;
    constructor(taskId: string, title: string, scheduledEnd: Date, assignedToId?: string | undefined, correlationId?: string | undefined);
}
export declare class EmployeeClockInEvent implements DomainEvent {
    readonly employeeId: string;
    readonly employeeName: string;
    readonly correlationId?: string | undefined;
    static readonly eventName = "employee.clock.in";
    timestamp: Date;
    constructor(employeeId: string, employeeName: string, correlationId?: string | undefined);
}
export declare class EmployeeClockOutEvent implements DomainEvent {
    readonly employeeId: string;
    readonly employeeName: string;
    readonly activeTaskIds?: string[] | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "employee.clock.out";
    timestamp: Date;
    constructor(employeeId: string, employeeName: string, activeTaskIds?: string[] | undefined, correlationId?: string | undefined);
}
export declare class IncidentNoteCreatedEvent implements DomainEvent {
    readonly noteId: string;
    readonly title: string | undefined;
    readonly content: string;
    readonly createdById: string;
    readonly suiteId?: string | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "note.incident.created";
    timestamp: Date;
    constructor(noteId: string, title: string | undefined, content: string, createdById: string, suiteId?: string | undefined, correlationId?: string | undefined);
}
export declare class NoteFollowUpDueEvent implements DomainEvent {
    readonly noteId: string;
    readonly title: string | undefined;
    readonly followUpDate: Date;
    readonly assignedToId?: string | undefined;
    readonly correlationId?: string | undefined;
    static readonly eventName = "note.followup.due";
    timestamp: Date;
    constructor(noteId: string, title: string | undefined, followUpDate: Date, assignedToId?: string | undefined, correlationId?: string | undefined);
}
export declare const DomainEventNames: {
    readonly SUITE_STATUS_CHANGED: "suite.status.changed";
    readonly SUITE_CHECKED_IN: "suite.checked.in";
    readonly SUITE_CHECKED_OUT: "suite.checked.out";
    readonly SUITE_OUT_OF_ORDER: "suite.out.of.order";
    readonly TASK_CREATED: "task.created";
    readonly TASK_ASSIGNED: "task.assigned";
    readonly TASK_STATUS_CHANGED: "task.status.changed";
    readonly TASK_COMPLETED: "task.completed";
    readonly TASK_VERIFIED: "task.verified";
    readonly TASK_EMERGENCY_CREATED: "task.emergency.created";
    readonly TASK_OVERDUE: "task.overdue";
    readonly EMPLOYEE_CLOCK_IN: "employee.clock.in";
    readonly EMPLOYEE_CLOCK_OUT: "employee.clock.out";
    readonly NOTE_INCIDENT_CREATED: "note.incident.created";
    readonly NOTE_FOLLOWUP_DUE: "note.followup.due";
};

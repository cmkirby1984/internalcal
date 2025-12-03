"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEventNames = exports.NoteFollowUpDueEvent = exports.IncidentNoteCreatedEvent = exports.EmployeeClockOutEvent = exports.EmployeeClockInEvent = exports.TaskOverdueEvent = exports.EmergencyTaskCreatedEvent = exports.TaskVerifiedEvent = exports.TaskCompletedEvent = exports.TaskStatusChangedEvent = exports.TaskAssignedEvent = exports.TaskCreatedEvent = exports.SuiteOutOfOrderEvent = exports.SuiteCheckedOutEvent = exports.SuiteCheckedInEvent = exports.SuiteStatusChangedEvent = void 0;
class SuiteStatusChangedEvent {
    suiteId;
    suiteNumber;
    previousStatus;
    newStatus;
    changedBy;
    correlationId;
    static eventName = 'suite.status.changed';
    timestamp = new Date();
    constructor(suiteId, suiteNumber, previousStatus, newStatus, changedBy, correlationId) {
        this.suiteId = suiteId;
        this.suiteNumber = suiteNumber;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy;
        this.correlationId = correlationId;
    }
}
exports.SuiteStatusChangedEvent = SuiteStatusChangedEvent;
class SuiteCheckedInEvent {
    suiteId;
    suiteNumber;
    guestName;
    checkInDate;
    checkOutDate;
    correlationId;
    static eventName = 'suite.checked.in';
    timestamp = new Date();
    constructor(suiteId, suiteNumber, guestName, checkInDate, checkOutDate, correlationId) {
        this.suiteId = suiteId;
        this.suiteNumber = suiteNumber;
        this.guestName = guestName;
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.correlationId = correlationId;
    }
}
exports.SuiteCheckedInEvent = SuiteCheckedInEvent;
class SuiteCheckedOutEvent {
    suiteId;
    suiteNumber;
    correlationId;
    static eventName = 'suite.checked.out';
    timestamp = new Date();
    constructor(suiteId, suiteNumber, correlationId) {
        this.suiteId = suiteId;
        this.suiteNumber = suiteNumber;
        this.correlationId = correlationId;
    }
}
exports.SuiteCheckedOutEvent = SuiteCheckedOutEvent;
class SuiteOutOfOrderEvent {
    suiteId;
    suiteNumber;
    reason;
    correlationId;
    static eventName = 'suite.out.of.order';
    timestamp = new Date();
    constructor(suiteId, suiteNumber, reason, correlationId) {
        this.suiteId = suiteId;
        this.suiteNumber = suiteNumber;
        this.reason = reason;
        this.correlationId = correlationId;
    }
}
exports.SuiteOutOfOrderEvent = SuiteOutOfOrderEvent;
class TaskCreatedEvent {
    taskId;
    title;
    type;
    priority;
    suiteId;
    suiteNumber;
    assignedToId;
    createdById;
    correlationId;
    static eventName = 'task.created';
    timestamp = new Date();
    constructor(taskId, title, type, priority, suiteId, suiteNumber, assignedToId, createdById, correlationId) {
        this.taskId = taskId;
        this.title = title;
        this.type = type;
        this.priority = priority;
        this.suiteId = suiteId;
        this.suiteNumber = suiteNumber;
        this.assignedToId = assignedToId;
        this.createdById = createdById;
        this.correlationId = correlationId;
    }
}
exports.TaskCreatedEvent = TaskCreatedEvent;
class TaskAssignedEvent {
    taskId;
    title;
    assignedToId;
    assignedToName;
    assignedById;
    previousAssigneeId;
    correlationId;
    static eventName = 'task.assigned';
    timestamp = new Date();
    constructor(taskId, title, assignedToId, assignedToName, assignedById, previousAssigneeId, correlationId) {
        this.taskId = taskId;
        this.title = title;
        this.assignedToId = assignedToId;
        this.assignedToName = assignedToName;
        this.assignedById = assignedById;
        this.previousAssigneeId = previousAssigneeId;
        this.correlationId = correlationId;
    }
}
exports.TaskAssignedEvent = TaskAssignedEvent;
class TaskStatusChangedEvent {
    taskId;
    title;
    previousStatus;
    newStatus;
    suiteId;
    changedById;
    correlationId;
    static eventName = 'task.status.changed';
    timestamp = new Date();
    constructor(taskId, title, previousStatus, newStatus, suiteId, changedById, correlationId) {
        this.taskId = taskId;
        this.title = title;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.suiteId = suiteId;
        this.changedById = changedById;
        this.correlationId = correlationId;
    }
}
exports.TaskStatusChangedEvent = TaskStatusChangedEvent;
class TaskCompletedEvent {
    taskId;
    title;
    type;
    suiteId;
    suiteNumber;
    completedById;
    duration;
    correlationId;
    static eventName = 'task.completed';
    timestamp = new Date();
    constructor(taskId, title, type, suiteId, suiteNumber, completedById, duration, correlationId) {
        this.taskId = taskId;
        this.title = title;
        this.type = type;
        this.suiteId = suiteId;
        this.suiteNumber = suiteNumber;
        this.completedById = completedById;
        this.duration = duration;
        this.correlationId = correlationId;
    }
}
exports.TaskCompletedEvent = TaskCompletedEvent;
class TaskVerifiedEvent {
    taskId;
    title;
    verifiedById;
    correlationId;
    static eventName = 'task.verified';
    timestamp = new Date();
    constructor(taskId, title, verifiedById, correlationId) {
        this.taskId = taskId;
        this.title = title;
        this.verifiedById = verifiedById;
        this.correlationId = correlationId;
    }
}
exports.TaskVerifiedEvent = TaskVerifiedEvent;
class EmergencyTaskCreatedEvent {
    taskId;
    title;
    suiteId;
    suiteNumber;
    description;
    createdById;
    correlationId;
    static eventName = 'task.emergency.created';
    timestamp = new Date();
    constructor(taskId, title, suiteId, suiteNumber, description, createdById, correlationId) {
        this.taskId = taskId;
        this.title = title;
        this.suiteId = suiteId;
        this.suiteNumber = suiteNumber;
        this.description = description;
        this.createdById = createdById;
        this.correlationId = correlationId;
    }
}
exports.EmergencyTaskCreatedEvent = EmergencyTaskCreatedEvent;
class TaskOverdueEvent {
    taskId;
    title;
    scheduledEnd;
    assignedToId;
    correlationId;
    static eventName = 'task.overdue';
    timestamp = new Date();
    constructor(taskId, title, scheduledEnd, assignedToId, correlationId) {
        this.taskId = taskId;
        this.title = title;
        this.scheduledEnd = scheduledEnd;
        this.assignedToId = assignedToId;
        this.correlationId = correlationId;
    }
}
exports.TaskOverdueEvent = TaskOverdueEvent;
class EmployeeClockInEvent {
    employeeId;
    employeeName;
    correlationId;
    static eventName = 'employee.clock.in';
    timestamp = new Date();
    constructor(employeeId, employeeName, correlationId) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.correlationId = correlationId;
    }
}
exports.EmployeeClockInEvent = EmployeeClockInEvent;
class EmployeeClockOutEvent {
    employeeId;
    employeeName;
    activeTaskIds;
    correlationId;
    static eventName = 'employee.clock.out';
    timestamp = new Date();
    constructor(employeeId, employeeName, activeTaskIds, correlationId) {
        this.employeeId = employeeId;
        this.employeeName = employeeName;
        this.activeTaskIds = activeTaskIds;
        this.correlationId = correlationId;
    }
}
exports.EmployeeClockOutEvent = EmployeeClockOutEvent;
class IncidentNoteCreatedEvent {
    noteId;
    title;
    content;
    createdById;
    suiteId;
    correlationId;
    static eventName = 'note.incident.created';
    timestamp = new Date();
    constructor(noteId, title, content, createdById, suiteId, correlationId) {
        this.noteId = noteId;
        this.title = title;
        this.content = content;
        this.createdById = createdById;
        this.suiteId = suiteId;
        this.correlationId = correlationId;
    }
}
exports.IncidentNoteCreatedEvent = IncidentNoteCreatedEvent;
class NoteFollowUpDueEvent {
    noteId;
    title;
    followUpDate;
    assignedToId;
    correlationId;
    static eventName = 'note.followup.due';
    timestamp = new Date();
    constructor(noteId, title, followUpDate, assignedToId, correlationId) {
        this.noteId = noteId;
        this.title = title;
        this.followUpDate = followUpDate;
        this.assignedToId = assignedToId;
        this.correlationId = correlationId;
    }
}
exports.NoteFollowUpDueEvent = NoteFollowUpDueEvent;
exports.DomainEventNames = {
    SUITE_STATUS_CHANGED: SuiteStatusChangedEvent.eventName,
    SUITE_CHECKED_IN: SuiteCheckedInEvent.eventName,
    SUITE_CHECKED_OUT: SuiteCheckedOutEvent.eventName,
    SUITE_OUT_OF_ORDER: SuiteOutOfOrderEvent.eventName,
    TASK_CREATED: TaskCreatedEvent.eventName,
    TASK_ASSIGNED: TaskAssignedEvent.eventName,
    TASK_STATUS_CHANGED: TaskStatusChangedEvent.eventName,
    TASK_COMPLETED: TaskCompletedEvent.eventName,
    TASK_VERIFIED: TaskVerifiedEvent.eventName,
    TASK_EMERGENCY_CREATED: EmergencyTaskCreatedEvent.eventName,
    TASK_OVERDUE: TaskOverdueEvent.eventName,
    EMPLOYEE_CLOCK_IN: EmployeeClockInEvent.eventName,
    EMPLOYEE_CLOCK_OUT: EmployeeClockOutEvent.eventName,
    NOTE_INCIDENT_CREATED: IncidentNoteCreatedEvent.eventName,
    NOTE_FOLLOWUP_DUE: NoteFollowUpDueEvent.eventName,
};
//# sourceMappingURL=domain-events.js.map
import { TaskStatus, TaskPriority } from '@prisma/client';
type TransitionRule = {
    from: TaskStatus[];
    to: TaskStatus;
    requires?: string[];
    description: string;
};
export declare class TaskStatusService {
    private readonly transitionRules;
    canTransition(from: TaskStatus, to: TaskStatus): {
        valid: boolean;
        rule?: TransitionRule;
        reason?: string;
    };
    validateTransition(from: TaskStatus, to: TaskStatus, context?: {
        assignedTo?: string | null;
        actualStart?: Date | null;
        actualEnd?: Date | null;
        verifiedBy?: string | null;
    }): {
        valid: boolean;
        reason?: string;
        missingFields?: string[];
    };
    getValidTransitions(from: TaskStatus): TaskStatus[];
    assertValidTransition(from: TaskStatus, to: TaskStatus, context?: {
        assignedTo?: string | null;
        actualStart?: Date | null;
        actualEnd?: Date | null;
        verifiedBy?: string | null;
    }): void;
    isActive(status: TaskStatus): boolean;
    isCompleted(status: TaskStatus): boolean;
    isActionable(status: TaskStatus): boolean;
    needsAssignment(status: TaskStatus): boolean;
    getPriorityWeight(priority: TaskPriority): number;
    isOverdue(scheduledEnd: Date | null, status: TaskStatus): boolean;
}
export {};

import { Injectable, BadRequestException } from '@nestjs/common';
import { TaskStatus, TaskPriority } from '@prisma/client';

/**
 * Task Status Transition Rules (from pseudo-code):
 * - PENDING -> ASSIGNED: Requires assignedTo to be set
 * - ASSIGNED -> IN_PROGRESS: Requires actualStart timestamp
 * - IN_PROGRESS -> COMPLETED: Requires actualEnd timestamp
 * - COMPLETED -> VERIFIED: Requires verifiedBy to be set
 * - IN_PROGRESS -> PAUSED: Allowed
 * - PAUSED -> IN_PROGRESS: Allowed
 */

type TransitionRule = {
  from: TaskStatus[];
  to: TaskStatus;
  requires?: string[];
  description: string;
};

@Injectable()
export class TaskStatusService {
  private readonly transitionRules: TransitionRule[] = [
    // Assignment flow
    {
      from: ['PENDING'],
      to: 'ASSIGNED',
      requires: ['assignedTo'],
      description: 'Task assigned to employee',
    },

    // Start work
    {
      from: ['ASSIGNED'],
      to: 'IN_PROGRESS',
      requires: ['actualStart'],
      description: 'Work started on task',
    },
    {
      from: ['PAUSED'],
      to: 'IN_PROGRESS',
      description: 'Work resumed on task',
    },

    // Pause work
    {
      from: ['IN_PROGRESS'],
      to: 'PAUSED',
      description: 'Work paused on task',
    },

    // Complete work
    {
      from: ['IN_PROGRESS'],
      to: 'COMPLETED',
      requires: ['actualEnd'],
      description: 'Task completed',
    },

    // Verification
    {
      from: ['COMPLETED'],
      to: 'VERIFIED',
      requires: ['verifiedBy'],
      description: 'Task verified by supervisor',
    },

    // Cancellation (can cancel from most states)
    {
      from: ['PENDING', 'ASSIGNED', 'PAUSED'],
      to: 'CANCELLED',
      description: 'Task cancelled',
    },

    // Re-open (edge cases)
    {
      from: ['CANCELLED'],
      to: 'PENDING',
      description: 'Cancelled task re-opened',
    },
    {
      from: ['COMPLETED'],
      to: 'IN_PROGRESS',
      description: 'Completed task re-opened for rework',
    },
  ];

  /**
   * Check if a status transition is valid
   */
  canTransition(
    from: TaskStatus,
    to: TaskStatus,
  ): { valid: boolean; rule?: TransitionRule; reason?: string } {
    if (from === to) {
      return { valid: true, reason: 'No change' };
    }

    const rule = this.transitionRules.find(
      (r) => r.from.includes(from) && r.to === to,
    );

    if (!rule) {
      return {
        valid: false,
        reason: `Invalid transition from ${from} to ${to}`,
      };
    }

    return { valid: true, rule };
  }

  /**
   * Validate transition with context data
   */
  validateTransition(
    from: TaskStatus,
    to: TaskStatus,
    context?: {
      assignedTo?: string | null;
      actualStart?: Date | null;
      actualEnd?: Date | null;
      verifiedBy?: string | null;
    },
  ): { valid: boolean; reason?: string; missingFields?: string[] } {
    const result = this.canTransition(from, to);

    if (!result.valid) {
      return result;
    }

    const rule = result.rule;
    if (!rule?.requires) {
      return { valid: true };
    }

    // Check required fields
    const missingFields: string[] = [];

    for (const field of rule.requires) {
      if (field === 'assignedTo' && !context?.assignedTo) {
        missingFields.push('assignedTo');
      }
      if (field === 'actualStart' && !context?.actualStart) {
        missingFields.push('actualStart');
      }
      if (field === 'actualEnd' && !context?.actualEnd) {
        missingFields.push('actualEnd');
      }
      if (field === 'verifiedBy' && !context?.verifiedBy) {
        missingFields.push('verifiedBy');
      }
    }

    if (missingFields.length > 0) {
      return {
        valid: false,
        reason: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
      };
    }

    return { valid: true };
  }

  /**
   * Get all valid next statuses from current status
   */
  getValidTransitions(from: TaskStatus): TaskStatus[] {
    return this.transitionRules
      .filter((r) => r.from.includes(from))
      .map((r) => r.to);
  }

  /**
   * Assert a transition is valid or throw
   */
  assertValidTransition(
    from: TaskStatus,
    to: TaskStatus,
    context?: {
      assignedTo?: string | null;
      actualStart?: Date | null;
      actualEnd?: Date | null;
      verifiedBy?: string | null;
    },
  ): void {
    const result = this.validateTransition(from, to, context);
    if (!result.valid) {
      throw new BadRequestException(result.reason);
    }
  }

  /**
   * Check if task is active (in progress or paused)
   */
  isActive(status: TaskStatus): boolean {
    return ['IN_PROGRESS', 'PAUSED'].includes(status);
  }

  /**
   * Check if task is completed (completed or verified)
   */
  isCompleted(status: TaskStatus): boolean {
    return ['COMPLETED', 'VERIFIED'].includes(status);
  }

  /**
   * Check if task is actionable (can be worked on)
   */
  isActionable(status: TaskStatus): boolean {
    return ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED'].includes(status);
  }

  /**
   * Check if task needs assignment
   */
  needsAssignment(status: TaskStatus): boolean {
    return status === 'PENDING';
  }

  /**
   * Get priority weight for sorting (higher = more urgent)
   */
  getPriorityWeight(priority: TaskPriority): number {
    const weights: Record<TaskPriority, number> = {
      LOW: 1,
      NORMAL: 2,
      HIGH: 3,
      URGENT: 4,
      EMERGENCY: 5,
    };
    return weights[priority];
  }

  /**
   * Check if task is overdue
   */
  isOverdue(scheduledEnd: Date | null, status: TaskStatus): boolean {
    if (!scheduledEnd) return false;
    if (this.isCompleted(status)) return false;
    return new Date() > scheduledEnd;
  }
}

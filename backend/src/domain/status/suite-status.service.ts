import { Injectable, BadRequestException } from '@nestjs/common';
import { SuiteStatus } from '@prisma/client';

/**
 * Suite Status Transition Rules (from pseudo-code):
 * - VACANT_DIRTY -> VACANT_CLEAN: Requires cleaning task completion
 * - OCCUPIED_DIRTY -> OCCUPIED_CLEAN: Requires cleaning task completion
 * - ANY_STATUS -> OUT_OF_ORDER: Requires maintenance task creation
 * - OUT_OF_ORDER -> VACANT_DIRTY: Requires maintenance task completion
 */

type TransitionRule = {
  from: SuiteStatus[];
  to: SuiteStatus;
  requiresTaskCompletion?: 'CLEANING' | 'MAINTENANCE';
  requiresTaskCreation?: 'MAINTENANCE';
  description: string;
};

@Injectable()
export class SuiteStatusService {
  private readonly transitionRules: TransitionRule[] = [
    // Cleaning transitions
    {
      from: ['VACANT_DIRTY'],
      to: 'VACANT_CLEAN',
      requiresTaskCompletion: 'CLEANING',
      description: 'Suite cleaned after checkout',
    },
    {
      from: ['OCCUPIED_DIRTY'],
      to: 'OCCUPIED_CLEAN',
      requiresTaskCompletion: 'CLEANING',
      description: 'Daily cleaning completed',
    },

    // Check-in/out transitions
    {
      from: ['VACANT_CLEAN'],
      to: 'OCCUPIED_CLEAN',
      description: 'Guest checked in',
    },
    {
      from: ['OCCUPIED_CLEAN', 'OCCUPIED_DIRTY'],
      to: 'VACANT_DIRTY',
      description: 'Guest checked out',
    },

    // Daily status changes
    {
      from: ['OCCUPIED_CLEAN'],
      to: 'OCCUPIED_DIRTY',
      description: 'Suite needs daily cleaning',
    },
    {
      from: ['VACANT_CLEAN'],
      to: 'VACANT_DIRTY',
      description: 'Suite needs re-cleaning',
    },

    // Maintenance transitions
    {
      from: [
        'VACANT_CLEAN',
        'VACANT_DIRTY',
        'OCCUPIED_CLEAN',
        'OCCUPIED_DIRTY',
        'BLOCKED',
      ],
      to: 'OUT_OF_ORDER',
      requiresTaskCreation: 'MAINTENANCE',
      description: 'Suite requires maintenance',
    },
    {
      from: ['OUT_OF_ORDER'],
      to: 'VACANT_DIRTY',
      requiresTaskCompletion: 'MAINTENANCE',
      description: 'Maintenance completed',
    },

    // Blocking transitions
    {
      from: ['VACANT_CLEAN', 'VACANT_DIRTY'],
      to: 'BLOCKED',
      description: 'Suite blocked/reserved',
    },
    {
      from: ['BLOCKED'],
      to: 'VACANT_CLEAN',
      description: 'Suite unblocked (clean)',
    },
    {
      from: ['BLOCKED'],
      to: 'VACANT_DIRTY',
      description: 'Suite unblocked (needs cleaning)',
    },
  ];

  /**
   * Check if a status transition is valid
   */
  canTransition(
    from: SuiteStatus,
    to: SuiteStatus,
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
   * Validate and return requirements for a transition
   */
  validateTransition(
    from: SuiteStatus,
    to: SuiteStatus,
    context?: {
      hasCompletedCleaningTask?: boolean;
      hasCompletedMaintenanceTask?: boolean;
      hasCreatedMaintenanceTask?: boolean;
    },
  ): { valid: boolean; reason?: string } {
    const result = this.canTransition(from, to);

    if (!result.valid) {
      return result;
    }

    const rule = result.rule;
    if (!rule) {
      return { valid: true };
    }

    // Check task completion requirements
    if (rule.requiresTaskCompletion === 'CLEANING') {
      if (!context?.hasCompletedCleaningTask) {
        return {
          valid: false,
          reason: 'Cleaning task must be completed before this transition',
        };
      }
    }

    if (rule.requiresTaskCompletion === 'MAINTENANCE') {
      if (!context?.hasCompletedMaintenanceTask) {
        return {
          valid: false,
          reason: 'Maintenance task must be completed before this transition',
        };
      }
    }

    // Check task creation requirements
    if (rule.requiresTaskCreation === 'MAINTENANCE') {
      if (!context?.hasCreatedMaintenanceTask) {
        return {
          valid: false,
          reason: 'Maintenance task must be created for this transition',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get all valid next statuses from current status
   */
  getValidTransitions(from: SuiteStatus): SuiteStatus[] {
    return this.transitionRules
      .filter((r) => r.from.includes(from))
      .map((r) => r.to);
  }

  /**
   * Get the status that results from completing a task type
   */
  getStatusAfterTaskCompletion(
    currentStatus: SuiteStatus,
    taskType: 'CLEANING' | 'MAINTENANCE',
  ): SuiteStatus | null {
    if (taskType === 'CLEANING') {
      if (currentStatus === 'VACANT_DIRTY') return 'VACANT_CLEAN';
      if (currentStatus === 'OCCUPIED_DIRTY') return 'OCCUPIED_CLEAN';
    }

    if (taskType === 'MAINTENANCE') {
      if (currentStatus === 'OUT_OF_ORDER') return 'VACANT_DIRTY';
    }

    return null;
  }

  /**
   * Assert a transition is valid or throw
   */
  assertValidTransition(from: SuiteStatus, to: SuiteStatus): void {
    const result = this.canTransition(from, to);
    if (!result.valid) {
      throw new BadRequestException(result.reason);
    }
  }

  /**
   * Check if suite is available for check-in
   */
  isAvailableForCheckIn(status: SuiteStatus): boolean {
    return status === 'VACANT_CLEAN';
  }

  /**
   * Check if suite needs attention (cleaning or maintenance)
   */
  needsAttention(status: SuiteStatus): boolean {
    return ['VACANT_DIRTY', 'OCCUPIED_DIRTY', 'OUT_OF_ORDER'].includes(status);
  }

  /**
   * Check if suite is occupied
   */
  isOccupied(status: SuiteStatus): boolean {
    return ['OCCUPIED_CLEAN', 'OCCUPIED_DIRTY'].includes(status);
  }
}


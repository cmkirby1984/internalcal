import { SuiteStatus } from '@prisma/client';
type TransitionRule = {
    from: SuiteStatus[];
    to: SuiteStatus;
    requiresTaskCompletion?: 'CLEANING' | 'MAINTENANCE';
    requiresTaskCreation?: 'MAINTENANCE';
    description: string;
};
export declare class SuiteStatusService {
    private readonly transitionRules;
    canTransition(from: SuiteStatus, to: SuiteStatus): {
        valid: boolean;
        rule?: TransitionRule;
        reason?: string;
    };
    validateTransition(from: SuiteStatus, to: SuiteStatus, context?: {
        hasCompletedCleaningTask?: boolean;
        hasCompletedMaintenanceTask?: boolean;
        hasCreatedMaintenanceTask?: boolean;
    }): {
        valid: boolean;
        reason?: string;
    };
    getValidTransitions(from: SuiteStatus): SuiteStatus[];
    getStatusAfterTaskCompletion(currentStatus: SuiteStatus, taskType: 'CLEANING' | 'MAINTENANCE'): SuiteStatus | null;
    assertValidTransition(from: SuiteStatus, to: SuiteStatus): void;
    isAvailableForCheckIn(status: SuiteStatus): boolean;
    needsAttention(status: SuiteStatus): boolean;
    isOccupied(status: SuiteStatus): boolean;
}
export {};

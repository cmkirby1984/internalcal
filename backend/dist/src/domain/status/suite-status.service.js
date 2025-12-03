"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuiteStatusService = void 0;
const common_1 = require("@nestjs/common");
let SuiteStatusService = class SuiteStatusService {
    transitionRules = [
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
    canTransition(from, to) {
        if (from === to) {
            return { valid: true, reason: 'No change' };
        }
        const rule = this.transitionRules.find((r) => r.from.includes(from) && r.to === to);
        if (!rule) {
            return {
                valid: false,
                reason: `Invalid transition from ${from} to ${to}`,
            };
        }
        return { valid: true, rule };
    }
    validateTransition(from, to, context) {
        const result = this.canTransition(from, to);
        if (!result.valid) {
            return result;
        }
        const rule = result.rule;
        if (!rule) {
            return { valid: true };
        }
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
    getValidTransitions(from) {
        return this.transitionRules
            .filter((r) => r.from.includes(from))
            .map((r) => r.to);
    }
    getStatusAfterTaskCompletion(currentStatus, taskType) {
        if (taskType === 'CLEANING') {
            if (currentStatus === 'VACANT_DIRTY')
                return 'VACANT_CLEAN';
            if (currentStatus === 'OCCUPIED_DIRTY')
                return 'OCCUPIED_CLEAN';
        }
        if (taskType === 'MAINTENANCE') {
            if (currentStatus === 'OUT_OF_ORDER')
                return 'VACANT_DIRTY';
        }
        return null;
    }
    assertValidTransition(from, to) {
        const result = this.canTransition(from, to);
        if (!result.valid) {
            throw new common_1.BadRequestException(result.reason);
        }
    }
    isAvailableForCheckIn(status) {
        return status === 'VACANT_CLEAN';
    }
    needsAttention(status) {
        return ['VACANT_DIRTY', 'OCCUPIED_DIRTY', 'OUT_OF_ORDER'].includes(status);
    }
    isOccupied(status) {
        return ['OCCUPIED_CLEAN', 'OCCUPIED_DIRTY'].includes(status);
    }
};
exports.SuiteStatusService = SuiteStatusService;
exports.SuiteStatusService = SuiteStatusService = __decorate([
    (0, common_1.Injectable)()
], SuiteStatusService);
//# sourceMappingURL=suite-status.service.js.map
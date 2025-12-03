"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatusService = void 0;
const common_1 = require("@nestjs/common");
let TaskStatusService = class TaskStatusService {
    transitionRules = [
        {
            from: ['PENDING'],
            to: 'ASSIGNED',
            requires: ['assignedTo'],
            description: 'Task assigned to employee',
        },
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
        {
            from: ['IN_PROGRESS'],
            to: 'PAUSED',
            description: 'Work paused on task',
        },
        {
            from: ['IN_PROGRESS'],
            to: 'COMPLETED',
            requires: ['actualEnd'],
            description: 'Task completed',
        },
        {
            from: ['COMPLETED'],
            to: 'VERIFIED',
            requires: ['verifiedBy'],
            description: 'Task verified by supervisor',
        },
        {
            from: ['PENDING', 'ASSIGNED', 'PAUSED'],
            to: 'CANCELLED',
            description: 'Task cancelled',
        },
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
        if (!rule?.requires) {
            return { valid: true };
        }
        const missingFields = [];
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
    getValidTransitions(from) {
        return this.transitionRules
            .filter((r) => r.from.includes(from))
            .map((r) => r.to);
    }
    assertValidTransition(from, to, context) {
        const result = this.validateTransition(from, to, context);
        if (!result.valid) {
            throw new common_1.BadRequestException(result.reason);
        }
    }
    isActive(status) {
        return ['IN_PROGRESS', 'PAUSED'].includes(status);
    }
    isCompleted(status) {
        return ['COMPLETED', 'VERIFIED'].includes(status);
    }
    isActionable(status) {
        return ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED'].includes(status);
    }
    needsAssignment(status) {
        return status === 'PENDING';
    }
    getPriorityWeight(priority) {
        const weights = {
            LOW: 1,
            NORMAL: 2,
            HIGH: 3,
            URGENT: 4,
            EMERGENCY: 5,
        };
        return weights[priority];
    }
    isOverdue(scheduledEnd, status) {
        if (!scheduledEnd)
            return false;
        if (this.isCompleted(status))
            return false;
        return new Date() > scheduledEnd;
    }
};
exports.TaskStatusService = TaskStatusService;
exports.TaskStatusService = TaskStatusService = __decorate([
    (0, common_1.Injectable)()
], TaskStatusService);
//# sourceMappingURL=task-status.service.js.map
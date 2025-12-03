"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TaskEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_1 = require("../../prisma");
const status_1 = require("../status");
const events_1 = require("../events");
let TaskEventListener = TaskEventListener_1 = class TaskEventListener {
    prisma;
    suiteStatusService;
    logger = new common_1.Logger(TaskEventListener_1.name);
    constructor(prisma, suiteStatusService) {
        this.prisma = prisma;
        this.suiteStatusService = suiteStatusService;
    }
    async handleTaskCompleted(event) {
        this.logger.log(`Task completed: ${event.title} (${event.taskId}) - Type: ${event.type}`);
        if (!event.suiteId) {
            return;
        }
        const suite = await this.prisma.suite.findUnique({
            where: { id: event.suiteId },
        });
        if (!suite) {
            return;
        }
        const newStatus = this.suiteStatusService.getStatusAfterTaskCompletion(suite.status, event.type);
        if (newStatus && newStatus !== suite.status) {
            await this.prisma.suite.update({
                where: { id: event.suiteId },
                data: {
                    status: newStatus,
                    ...(event.type === 'CLEANING' && { lastCleaned: new Date() }),
                },
            });
            this.logger.log(`Suite ${suite.suiteNumber} status updated: ${suite.status} -> ${newStatus}`);
        }
        if (event.completedById) {
            await this.prisma.employee.update({
                where: { id: event.completedById },
                data: {
                    tasksCompleted: { increment: 1 },
                    lastActive: new Date(),
                },
            });
        }
    }
    async handleTaskAssigned(event) {
        this.logger.log(`Task assigned: ${event.title} to ${event.assignedToName}`);
        await this.prisma.notification.create({
            data: {
                recipientId: event.assignedToId,
                type: 'TASK_ASSIGNED',
                title: 'New Task Assigned',
                message: event.title,
                priority: 'NORMAL',
                relatedEntityType: 'Task',
                relatedEntityId: event.taskId,
                actionUrl: `/tasks/${event.taskId}`,
            },
        });
    }
    async handleEmergencyTask(event) {
        this.logger.warn(`EMERGENCY TASK: ${event.title} - Suite: ${event.suiteNumber || 'N/A'}`);
        const supervisors = await this.prisma.employee.findMany({
            where: {
                role: { in: ['SUPERVISOR', 'MANAGER', 'ADMIN'] },
                status: { not: 'INACTIVE' },
            },
            select: { id: true },
        });
        if (supervisors.length > 0) {
            await this.prisma.notification.createMany({
                data: supervisors.map((s) => ({
                    recipientId: s.id,
                    type: 'EMERGENCY_TASK',
                    title: '🚨 EMERGENCY TASK',
                    message: `${event.title}${event.suiteNumber ? ` - Suite ${event.suiteNumber}` : ''}`,
                    priority: 'URGENT',
                    relatedEntityType: 'Task',
                    relatedEntityId: event.taskId,
                    actionUrl: `/tasks/${event.taskId}`,
                    actionRequired: true,
                })),
            });
            this.logger.log(`Emergency notifications sent to ${supervisors.length} supervisors`);
        }
    }
};
exports.TaskEventListener = TaskEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.TASK_COMPLETED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.TaskCompletedEvent]),
    __metadata("design:returntype", Promise)
], TaskEventListener.prototype, "handleTaskCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.TASK_ASSIGNED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.TaskAssignedEvent]),
    __metadata("design:returntype", Promise)
], TaskEventListener.prototype, "handleTaskAssigned", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.TASK_EMERGENCY_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.EmergencyTaskCreatedEvent]),
    __metadata("design:returntype", Promise)
], TaskEventListener.prototype, "handleEmergencyTask", null);
exports.TaskEventListener = TaskEventListener = TaskEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        status_1.SuiteStatusService])
], TaskEventListener);
//# sourceMappingURL=task-event.listener.js.map
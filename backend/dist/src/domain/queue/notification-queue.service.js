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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationQueueService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
let NotificationQueueService = NotificationQueueService_1 = class NotificationQueueService {
    notificationQueue;
    logger = new common_1.Logger(NotificationQueueService_1.name);
    constructor(notificationQueue) {
        this.notificationQueue = notificationQueue;
    }
    async queueNotification(data) {
        const job = await this.notificationQueue.add('send', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
        this.logger.debug(`Queued notification job: ${job.id}`);
        return job;
    }
    async queueBulkNotification(data) {
        const job = await this.notificationQueue.add('send-bulk', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
        this.logger.debug(`Queued bulk notification job: ${job.id} for ${data.recipientIds.length} recipients`);
        return job;
    }
    async queueTaskAssignedNotification(recipientId, taskId, taskTitle) {
        return this.queueNotification({
            recipientId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: taskTitle,
            priority: 'NORMAL',
            relatedEntityType: 'Task',
            relatedEntityId: taskId,
            actionUrl: `/tasks/${taskId}`,
        });
    }
    async queueEmergencyNotification(recipientIds, taskId, taskTitle, suiteNumber) {
        return this.queueBulkNotification({
            recipientIds,
            type: 'EMERGENCY_TASK',
            title: '🚨 EMERGENCY TASK',
            message: `${taskTitle}${suiteNumber ? ` - Suite ${suiteNumber}` : ''}`,
            priority: 'URGENT',
            relatedEntityType: 'Task',
            relatedEntityId: taskId,
            actionUrl: `/tasks/${taskId}`,
            actionRequired: true,
        });
    }
    async queueSuiteStatusNotification(recipientIds, suiteId, suiteNumber, message) {
        return this.queueBulkNotification({
            recipientIds,
            type: 'SUITE_STATUS_CHANGE',
            title: 'Suite Status Change',
            message,
            priority: 'NORMAL',
            relatedEntityType: 'Suite',
            relatedEntityId: suiteId,
            actionUrl: `/suites/${suiteId}`,
        });
    }
    async scheduleCleanup(daysOld = 30) {
        const job = await this.notificationQueue.add('cleanup', { daysOld }, {
            repeat: {
                cron: '0 3 * * *',
            },
            removeOnComplete: true,
        });
        this.logger.log(`Scheduled notification cleanup job: ${job.id}`);
        return job;
    }
    async getQueueStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.notificationQueue.getWaitingCount(),
            this.notificationQueue.getActiveCount(),
            this.notificationQueue.getCompletedCount(),
            this.notificationQueue.getFailedCount(),
            this.notificationQueue.getDelayedCount(),
        ]);
        return { waiting, active, completed, failed, delayed };
    }
};
exports.NotificationQueueService = NotificationQueueService;
exports.NotificationQueueService = NotificationQueueService = NotificationQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('notifications')),
    __metadata("design:paramtypes", [Object])
], NotificationQueueService);
//# sourceMappingURL=notification-queue.service.js.map
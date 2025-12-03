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
var NotificationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../prisma");
let NotificationProcessor = NotificationProcessor_1 = class NotificationProcessor {
    prisma;
    logger = new common_1.Logger(NotificationProcessor_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleSendNotification(job) {
        this.logger.debug(`Processing notification job ${job.id}`);
        const { recipientId, type, title, message, ...rest } = job.data;
        try {
            const recipient = await this.prisma.employee.findUnique({
                where: { id: recipientId },
                select: { id: true, status: true, preferredContactMethod: true },
            });
            if (!recipient || recipient.status === 'INACTIVE') {
                this.logger.warn(`Skipping notification for inactive/missing recipient: ${recipientId}`);
                return { skipped: true, reason: 'Recipient not found or inactive' };
            }
            const notification = await this.prisma.notification.create({
                data: {
                    recipientId,
                    type: type,
                    title,
                    message,
                    priority: rest.priority || 'NORMAL',
                    relatedEntityType: rest.relatedEntityType,
                    relatedEntityId: rest.relatedEntityId,
                    actionUrl: rest.actionUrl,
                    actionRequired: rest.actionRequired || false,
                },
            });
            this.logger.log(`Notification created: ${notification.id} for ${recipientId}`);
            return { success: true, notificationId: notification.id };
        }
        catch (error) {
            this.logger.error(`Failed to process notification job ${job.id}: ${error.message}`);
            throw error;
        }
    }
    async handleBulkNotification(job) {
        this.logger.debug(`Processing bulk notification job ${job.id} for ${job.data.recipientIds.length} recipients`);
        const { recipientIds, type, title, message, ...rest } = job.data;
        try {
            const result = await this.prisma.notification.createMany({
                data: recipientIds.map((recipientId) => ({
                    recipientId,
                    type: type,
                    title,
                    message,
                    priority: rest.priority || 'NORMAL',
                    relatedEntityType: rest.relatedEntityType,
                    relatedEntityId: rest.relatedEntityId,
                    actionUrl: rest.actionUrl,
                    actionRequired: rest.actionRequired || false,
                })),
            });
            this.logger.log(`Bulk notifications created: ${result.count} notifications`);
            return { success: true, count: result.count };
        }
        catch (error) {
            this.logger.error(`Failed to process bulk notification job ${job.id}: ${error.message}`);
            throw error;
        }
    }
    async handleCleanup(job) {
        const { daysOld } = job.data;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        this.logger.debug(`Cleaning up notifications older than ${daysOld} days`);
        try {
            const result = await this.prisma.notification.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate },
                    read: true,
                },
            });
            this.logger.log(`Cleaned up ${result.count} old notifications`);
            return { success: true, count: result.count };
        }
        catch (error) {
            this.logger.error(`Failed to cleanup notifications: ${error.message}`);
            throw error;
        }
    }
};
exports.NotificationProcessor = NotificationProcessor;
__decorate([
    (0, bull_1.Process)('send'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationProcessor.prototype, "handleSendNotification", null);
__decorate([
    (0, bull_1.Process)('send-bulk'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationProcessor.prototype, "handleBulkNotification", null);
__decorate([
    (0, bull_1.Process)('cleanup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationProcessor.prototype, "handleCleanup", null);
exports.NotificationProcessor = NotificationProcessor = NotificationProcessor_1 = __decorate([
    (0, bull_1.Processor)('notifications'),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], NotificationProcessor);
//# sourceMappingURL=notification.processor.js.map
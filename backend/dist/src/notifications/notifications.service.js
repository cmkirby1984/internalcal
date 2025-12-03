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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createNotificationDto) {
        return this.prisma.notification.create({
            data: createNotificationDto,
        });
    }
    async createMany(notifications) {
        return this.prisma.notification.createMany({
            data: notifications,
        });
    }
    async findAllForUser(userId, includeRead = false) {
        const where = {
            recipientId: userId,
        };
        if (!includeRead) {
            where.read = false;
        }
        return this.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: {
                recipientId: userId,
                read: false,
            },
        });
    }
    async markAsRead(id) {
        try {
            return await this.prisma.notification.update({
                where: { id },
                data: {
                    read: true,
                    readAt: new Date(),
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Notification with ID ${id} not found`);
            }
            throw error;
        }
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: {
                recipientId: userId,
                read: false,
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });
    }
    async remove(id) {
        try {
            return await this.prisma.notification.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Notification with ID ${id} not found`);
            }
            throw error;
        }
    }
    async clearOld(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        return this.prisma.notification.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
                read: true,
            },
        });
    }
    async notifyTaskAssigned(taskId, assignedToId, taskTitle) {
        return this.create({
            recipientId: assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            message: taskTitle,
            priority: 'NORMAL',
            relatedEntityType: 'Task',
            relatedEntityId: taskId,
            actionUrl: `/tasks/${taskId}`,
        });
    }
    async notifyEmergencyTask(taskId, taskTitle, recipientIds) {
        const notifications = recipientIds.map((recipientId) => ({
            recipientId,
            type: 'EMERGENCY_TASK',
            title: 'EMERGENCY Task Created',
            message: taskTitle,
            priority: 'URGENT',
            relatedEntityType: 'Task',
            relatedEntityId: taskId,
            actionUrl: `/tasks/${taskId}`,
            actionRequired: true,
        }));
        return this.createMany(notifications);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
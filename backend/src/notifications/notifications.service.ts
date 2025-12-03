import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateNotificationDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: createNotificationDto,
    });
  }

  async createMany(notifications: CreateNotificationDto[]) {
    return this.prisma.notification.createMany({
      data: notifications,
    });
  }

  async findAllForUser(userId: string, includeRead = false) {
    const where: Prisma.NotificationWhereInput = {
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

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });
  }

  async markAsRead(id: string) {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
      }
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
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

  async remove(id: string) {
    try {
      return await this.prisma.notification.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Notification with ID ${id} not found`);
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

  // Helper to send task-related notifications
  async notifyTaskAssigned(taskId: string, assignedToId: string, taskTitle: string) {
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

  async notifyEmergencyTask(taskId: string, taskTitle: string, recipientIds: string[]) {
    const notifications = recipientIds.map((recipientId) => ({
      recipientId,
      type: 'EMERGENCY_TASK' as const,
      title: 'EMERGENCY Task Created',
      message: taskTitle,
      priority: 'URGENT' as const,
      relatedEntityType: 'Task',
      relatedEntityId: taskId,
      actionUrl: `/tasks/${taskId}`,
      actionRequired: true,
    }));

    return this.createMany(notifications);
  }
}


import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma';

export interface NotificationJobData {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  priority?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  actionRequired?: boolean;
}

export interface BulkNotificationJobData {
  recipientIds: string[];
  type: string;
  title: string;
  message: string;
  priority?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  actionRequired?: boolean;
}

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process a single notification job
   */
  @Process('send')
  async handleSendNotification(job: Job<NotificationJobData>) {
    this.logger.debug(`Processing notification job ${job.id}`);

    const { recipientId, type, title, message, ...rest } = job.data;

    try {
      // Verify recipient exists and is active
      const recipient = await this.prisma.employee.findUnique({
        where: { id: recipientId },
        select: { id: true, status: true, preferredContactMethod: true },
      });

      if (!recipient || recipient.status === 'INACTIVE') {
        this.logger.warn(
          `Skipping notification for inactive/missing recipient: ${recipientId}`,
        );
        return { skipped: true, reason: 'Recipient not found or inactive' };
      }

      // Create the notification
      const notification = await this.prisma.notification.create({
        data: {
          recipientId,
          type: type as any,
          title,
          message,
          priority: (rest.priority as any) || 'NORMAL',
          relatedEntityType: rest.relatedEntityType,
          relatedEntityId: rest.relatedEntityId,
          actionUrl: rest.actionUrl,
          actionRequired: rest.actionRequired || false,
        },
      });

      this.logger.log(
        `Notification created: ${notification.id} for ${recipientId}`,
      );

      // TODO: Send push notification, email, or SMS based on preferredContactMethod
      // This would integrate with external services like:
      // - Firebase Cloud Messaging for push
      // - SendGrid/SES for email
      // - Twilio for SMS

      return { success: true, notificationId: notification.id };
    } catch (error) {
      this.logger.error(
        `Failed to process notification job ${job.id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Process bulk notifications (e.g., emergency alerts)
   */
  @Process('send-bulk')
  async handleBulkNotification(job: Job<BulkNotificationJobData>) {
    this.logger.debug(
      `Processing bulk notification job ${job.id} for ${job.data.recipientIds.length} recipients`,
    );

    const { recipientIds, type, title, message, ...rest } = job.data;

    try {
      // Create notifications for all recipients
      const result = await this.prisma.notification.createMany({
        data: recipientIds.map((recipientId) => ({
          recipientId,
          type: type as any,
          title,
          message,
          priority: (rest.priority as any) || 'NORMAL',
          relatedEntityType: rest.relatedEntityType,
          relatedEntityId: rest.relatedEntityId,
          actionUrl: rest.actionUrl,
          actionRequired: rest.actionRequired || false,
        })),
      });

      this.logger.log(
        `Bulk notifications created: ${result.count} notifications`,
      );

      return { success: true, count: result.count };
    } catch (error) {
      this.logger.error(
        `Failed to process bulk notification job ${job.id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Clean up old read notifications
   */
  @Process('cleanup')
  async handleCleanup(job: Job<{ daysOld: number }>) {
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
    } catch (error) {
      this.logger.error(`Failed to cleanup notifications: ${error.message}`);
      throw error;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  NotificationJobData,
  BulkNotificationJobData,
} from './notification.processor';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  /**
   * Queue a single notification
   */
  async queueNotification(data: NotificationJobData) {
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

  /**
   * Queue notifications for multiple recipients
   */
  async queueBulkNotification(data: BulkNotificationJobData) {
    const job = await this.notificationQueue.add('send-bulk', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.debug(
      `Queued bulk notification job: ${job.id} for ${data.recipientIds.length} recipients`,
    );
    return job;
  }

  /**
   * Queue a task assignment notification
   */
  async queueTaskAssignedNotification(
    recipientId: string,
    taskId: string,
    taskTitle: string,
  ) {
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

  /**
   * Queue an emergency task notification for all supervisors
   */
  async queueEmergencyNotification(
    recipientIds: string[],
    taskId: string,
    taskTitle: string,
    suiteNumber?: string,
  ) {
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

  /**
   * Queue a suite status change notification
   */
  async queueSuiteStatusNotification(
    recipientIds: string[],
    suiteId: string,
    suiteNumber: string,
    message: string,
  ) {
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

  /**
   * Schedule cleanup of old notifications
   */
  async scheduleCleanup(daysOld = 30) {
    const job = await this.notificationQueue.add(
      'cleanup',
      { daysOld },
      {
        repeat: {
          cron: '0 3 * * *', // Run at 3 AM daily
        },
        removeOnComplete: true,
      },
    );

    this.logger.log(`Scheduled notification cleanup job: ${job.id}`);
    return job;
  }

  /**
   * Get queue statistics
   */
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
}


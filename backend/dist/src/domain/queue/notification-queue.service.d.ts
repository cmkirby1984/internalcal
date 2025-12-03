import type { Queue } from 'bull';
import { NotificationJobData, BulkNotificationJobData } from './notification.processor';
export declare class NotificationQueueService {
    private readonly notificationQueue;
    private readonly logger;
    constructor(notificationQueue: Queue);
    queueNotification(data: NotificationJobData): Promise<import("bull").Job<any>>;
    queueBulkNotification(data: BulkNotificationJobData): Promise<import("bull").Job<any>>;
    queueTaskAssignedNotification(recipientId: string, taskId: string, taskTitle: string): Promise<import("bull").Job<any>>;
    queueEmergencyNotification(recipientIds: string[], taskId: string, taskTitle: string, suiteNumber?: string): Promise<import("bull").Job<any>>;
    queueSuiteStatusNotification(recipientIds: string[], suiteId: string, suiteNumber: string, message: string): Promise<import("bull").Job<any>>;
    scheduleCleanup(daysOld?: number): Promise<import("bull").Job<any>>;
    getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
}

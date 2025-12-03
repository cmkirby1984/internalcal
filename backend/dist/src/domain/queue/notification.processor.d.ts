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
export declare class NotificationProcessor {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleSendNotification(job: Job<NotificationJobData>): Promise<{
        skipped: boolean;
        reason: string;
        success?: undefined;
        notificationId?: undefined;
    } | {
        success: boolean;
        notificationId: string;
        skipped?: undefined;
        reason?: undefined;
    }>;
    handleBulkNotification(job: Job<BulkNotificationJobData>): Promise<{
        success: boolean;
        count: number;
    }>;
    handleCleanup(job: Job<{
        daysOld: number;
    }>): Promise<{
        success: boolean;
        count: number;
    }>;
}

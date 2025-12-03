import { NotificationType, NotePriority } from '@prisma/client';
export declare class CreateNotificationDto {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotePriority;
    actionRequired?: boolean;
    actionUrl?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    expiresAt?: string;
}

import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(userId: string, includeRead?: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string;
        expiresAt: Date | null;
        message: string;
        read: boolean;
        readAt: Date | null;
        actionRequired: boolean;
        actionUrl: string | null;
        relatedEntityType: string | null;
        relatedEntityId: string | null;
        recipientId: string;
    }[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string;
        expiresAt: Date | null;
        message: string;
        read: boolean;
        readAt: Date | null;
        actionRequired: boolean;
        actionUrl: string | null;
        relatedEntityType: string | null;
        relatedEntityId: string | null;
        recipientId: string;
    }>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string;
        expiresAt: Date | null;
        message: string;
        read: boolean;
        readAt: Date | null;
        actionRequired: boolean;
        actionUrl: string | null;
        relatedEntityType: string | null;
        relatedEntityId: string | null;
        recipientId: string;
    }>;
}

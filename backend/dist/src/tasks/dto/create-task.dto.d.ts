import { TaskType, TaskPriority, TaskStatus } from '@prisma/client';
export declare class CreateTaskDto {
    type: TaskType;
    priority?: TaskPriority;
    status?: TaskStatus;
    title: string;
    description?: string;
    assignedToId?: string;
    assignedById?: string;
    suiteId?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
    estimatedDuration?: number;
    customFields?: Record<string, any>;
    recurring?: boolean;
    recurrencePattern?: Record<string, any>;
    attachedPhotos?: string[];
}

import { TaskType, TaskPriority, TaskStatus } from '@prisma/client';
import { PaginationDto } from '../../common';
export declare class FilterTasksDto extends PaginationDto {
    status?: TaskStatus;
    type?: TaskType;
    priority?: TaskPriority;
    assignedToId?: string;
    suiteId?: string;
    scheduledAfter?: string;
    scheduledBefore?: string;
    search?: string;
    sortBy?: 'createdAt' | 'scheduledStart' | 'priority' | 'status';
    sortOrder?: 'asc' | 'desc';
}

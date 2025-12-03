import { NoteType, NotePriority } from '@prisma/client';
import { PaginationDto } from '../../common';
export declare class FilterNotesDto extends PaginationDto {
    type?: NoteType;
    priority?: NotePriority;
    relatedSuiteId?: string;
    relatedTaskId?: string;
    createdById?: string;
    showArchived?: boolean;
    pinnedOnly?: boolean;
    search?: string;
    tag?: string;
}

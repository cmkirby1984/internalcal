import { NoteType, NotePriority, NoteVisibility } from '@prisma/client';
export declare class CreateNoteDto {
    type?: NoteType;
    priority?: NotePriority;
    title?: string;
    content: string;
    relatedSuiteId?: string;
    relatedTaskId?: string;
    relatedEmployeeId?: string;
    visibility?: NoteVisibility;
    pinned?: boolean;
    tags?: string[];
    requiresFollowUp?: boolean;
    followUpDate?: string;
    followUpAssignedToId?: string;
    expiresAt?: string;
}

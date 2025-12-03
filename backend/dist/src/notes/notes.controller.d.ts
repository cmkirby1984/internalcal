import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto, FilterNotesDto } from './dto';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
    create(createNoteDto: CreateNoteDto, userId: string): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        relatedSuite: {
            id: string;
            suiteNumber: string;
        } | null;
        relatedTask: {
            id: string;
            title: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    }>;
    findAll(filters: FilterNotesDto, userId: string): Promise<{
        data: ({
            _count: {
                comments: number;
            };
            createdBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
            relatedSuite: {
                id: string;
                suiteNumber: string;
            } | null;
            relatedTask: {
                id: string;
                title: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.NoteType;
            priority: import(".prisma/client").$Enums.NotePriority;
            title: string | null;
            content: string;
            visibility: import(".prisma/client").$Enums.NoteVisibility;
            pinned: boolean;
            archived: boolean;
            tags: string[];
            requiresFollowUp: boolean;
            followUpDate: Date | null;
            followUpCompleted: boolean;
            expiresAt: Date | null;
            createdById: string;
            relatedSuiteId: string | null;
            relatedTaskId: string | null;
            relatedEmployeeId: string | null;
            followUpAssignedToId: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getPinned(): Promise<({
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    })[]>;
    getFollowUpDue(): Promise<({
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
        followUpAssignedTo: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    })[]>;
    findOne(id: string): Promise<{
        createdBy: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        relatedSuite: {
            id: string;
            status: import(".prisma/client").$Enums.SuiteStatus;
            createdAt: Date;
            updatedAt: Date;
            suiteNumber: string;
            floor: number;
            type: import(".prisma/client").$Enums.SuiteType;
            currentGuest: import("@prisma/client/runtime/library").JsonValue | null;
            bedConfiguration: import(".prisma/client").$Enums.BedConfiguration;
            amenities: string[];
            squareFeet: number | null;
            lastCleaned: Date | null;
            lastInspected: Date | null;
            nextScheduledMaintenance: Date | null;
            notes: string | null;
        } | null;
        relatedTask: {
            id: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TaskType;
            priority: import(".prisma/client").$Enums.TaskPriority;
            title: string;
            description: string | null;
            scheduledStart: Date | null;
            scheduledEnd: Date | null;
            estimatedDuration: number | null;
            actualStart: Date | null;
            actualEnd: Date | null;
            actualDuration: number | null;
            completionNotes: string | null;
            verificationNotes: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue | null;
            recurring: boolean;
            recurrencePattern: import("@prisma/client/runtime/library").JsonValue | null;
            completedAt: Date | null;
            attachedPhotos: string[];
            assignedToId: string | null;
            assignedById: string | null;
            suiteId: string | null;
            verifiedById: string | null;
            parentTaskId: string | null;
        } | null;
        relatedEmployee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        followUpAssignedTo: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        attachments: {
            id: string;
            noteId: string;
            fileUrl: string;
            fileName: string;
            fileType: string;
            uploadedAt: Date;
        }[];
        comments: ({
            commentBy: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            text: string;
            noteId: string;
            commentById: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    }>;
    update(id: string, updateNoteDto: UpdateNoteDto): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    }>;
    addComment(id: string, text: string, userId: string): Promise<{
        commentBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        text: string;
        noteId: string;
        commentById: string;
    }>;
    markAsRead(id: string, userId: string): Promise<{
        id: string;
        readAt: Date;
        employeeId: string;
        noteId: string;
    }>;
    archive(id: string): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    }>;
    unarchive(id: string): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    }>;
    pin(id: string): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    }>;
    unpin(id: string): Promise<{
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.NoteType;
        priority: import(".prisma/client").$Enums.NotePriority;
        title: string | null;
        content: string;
        visibility: import(".prisma/client").$Enums.NoteVisibility;
        pinned: boolean;
        archived: boolean;
        tags: string[];
        requiresFollowUp: boolean;
        followUpDate: Date | null;
        followUpCompleted: boolean;
        expiresAt: Date | null;
        createdById: string;
        relatedSuiteId: string | null;
        relatedTaskId: string | null;
        relatedEmployeeId: string | null;
        followUpAssignedToId: string | null;
    }>;
}

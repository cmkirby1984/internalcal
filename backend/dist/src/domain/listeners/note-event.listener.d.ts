import { PrismaService } from '../../prisma';
import { IncidentNoteCreatedEvent, NoteFollowUpDueEvent } from '../events';
export declare class NoteEventListener {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleIncidentNote(event: IncidentNoteCreatedEvent): Promise<void>;
    handleFollowUpDue(event: NoteFollowUpDueEvent): Promise<void>;
}

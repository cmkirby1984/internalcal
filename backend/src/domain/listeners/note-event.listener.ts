import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma';
import {
  IncidentNoteCreatedEvent,
  NoteFollowUpDueEvent,
  DomainEventNames,
} from '../events';

@Injectable()
export class NoteEventListener {
  private readonly logger = new Logger(NoteEventListener.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * When an incident note is created, notify all managers
   */
  @OnEvent(DomainEventNames.NOTE_INCIDENT_CREATED)
  async handleIncidentNote(event: IncidentNoteCreatedEvent) {
    this.logger.warn(`INCIDENT NOTE: ${event.title || 'Untitled'}`);

    // Find all managers
    const managers = await this.prisma.employee.findMany({
      where: {
        role: { in: ['MANAGER', 'ADMIN'] },
        status: { not: 'INACTIVE' },
      },
      select: { id: true },
    });

    // Notify all managers
    if (managers.length > 0) {
      await this.prisma.notification.createMany({
        data: managers.map((m) => ({
          recipientId: m.id,
          type: 'SYSTEM_ALERT' as const,
          title: '⚠️ Incident Report',
          message: event.title || event.content.substring(0, 100),
          priority: 'URGENT' as const,
          relatedEntityType: 'Note',
          relatedEntityId: event.noteId,
          actionUrl: `/notes/${event.noteId}`,
        })),
      });

      this.logger.log(`Incident notifications sent to ${managers.length} managers`);
    }
  }

  /**
   * When a follow-up is due, notify the assigned person
   */
  @OnEvent(DomainEventNames.NOTE_FOLLOWUP_DUE)
  async handleFollowUpDue(event: NoteFollowUpDueEvent) {
    this.logger.log(`Follow-up due: ${event.title || 'Note'}`);

    if (event.assignedToId) {
      await this.prisma.notification.create({
        data: {
          recipientId: event.assignedToId,
          type: 'SYSTEM_ALERT',
          title: 'Follow-up Required',
          message: `Follow-up due for: ${event.title || 'Note'}`,
          priority: 'HIGH',
          relatedEntityType: 'Note',
          relatedEntityId: event.noteId,
          actionUrl: `/notes/${event.noteId}`,
          actionRequired: true,
        },
      });
    }
  }
}


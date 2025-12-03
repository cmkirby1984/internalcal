"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NoteEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_1 = require("../../prisma");
const events_1 = require("../events");
let NoteEventListener = NoteEventListener_1 = class NoteEventListener {
    prisma;
    logger = new common_1.Logger(NoteEventListener_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleIncidentNote(event) {
        this.logger.warn(`INCIDENT NOTE: ${event.title || 'Untitled'}`);
        const managers = await this.prisma.employee.findMany({
            where: {
                role: { in: ['MANAGER', 'ADMIN'] },
                status: { not: 'INACTIVE' },
            },
            select: { id: true },
        });
        if (managers.length > 0) {
            await this.prisma.notification.createMany({
                data: managers.map((m) => ({
                    recipientId: m.id,
                    type: 'SYSTEM_ALERT',
                    title: '⚠️ Incident Report',
                    message: event.title || event.content.substring(0, 100),
                    priority: 'URGENT',
                    relatedEntityType: 'Note',
                    relatedEntityId: event.noteId,
                    actionUrl: `/notes/${event.noteId}`,
                })),
            });
            this.logger.log(`Incident notifications sent to ${managers.length} managers`);
        }
    }
    async handleFollowUpDue(event) {
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
};
exports.NoteEventListener = NoteEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.NOTE_INCIDENT_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.IncidentNoteCreatedEvent]),
    __metadata("design:returntype", Promise)
], NoteEventListener.prototype, "handleIncidentNote", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.NOTE_FOLLOWUP_DUE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.NoteFollowUpDueEvent]),
    __metadata("design:returntype", Promise)
], NoteEventListener.prototype, "handleFollowUpDue", null);
exports.NoteEventListener = NoteEventListener = NoteEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], NoteEventListener);
//# sourceMappingURL=note-event.listener.js.map
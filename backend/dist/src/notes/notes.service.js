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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
let NotesService = class NotesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createNoteDto, createdById) {
        return this.prisma.note.create({
            data: {
                ...createNoteDto,
                createdById,
                tags: createNoteDto.tags ?? [],
            },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                relatedSuite: {
                    select: { id: true, suiteNumber: true },
                },
                relatedTask: {
                    select: { id: true, title: true },
                },
            },
        });
    }
    async findAll(filters, userId) {
        const { page = 1, limit = 20, type, priority, relatedSuiteId, relatedTaskId, createdById, showArchived, pinnedOnly, search, tag, } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (type)
            where.type = type;
        if (priority)
            where.priority = priority;
        if (relatedSuiteId)
            where.relatedSuiteId = relatedSuiteId;
        if (relatedTaskId)
            where.relatedTaskId = relatedTaskId;
        if (createdById)
            where.createdById = createdById;
        if (!showArchived)
            where.archived = false;
        if (pinnedOnly)
            where.pinned = true;
        if (tag)
            where.tags = { has: tag };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.note.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    relatedSuite: {
                        select: { id: true, suiteNumber: true },
                    },
                    relatedTask: {
                        select: { id: true, title: true },
                    },
                    _count: {
                        select: { comments: true },
                    },
                },
            }),
            this.prisma.note.count({ where }),
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const note = await this.prisma.note.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                relatedSuite: true,
                relatedTask: true,
                relatedEmployee: {
                    select: { id: true, firstName: true, lastName: true },
                },
                followUpAssignedTo: {
                    select: { id: true, firstName: true, lastName: true },
                },
                attachments: true,
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        commentBy: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                },
            },
        });
        if (!note) {
            throw new common_1.NotFoundException(`Note with ID ${id} not found`);
        }
        return note;
    }
    async update(id, updateNoteDto) {
        try {
            return await this.prisma.note.update({
                where: { id },
                data: updateNoteDto,
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Note with ID ${id} not found`);
            }
            throw error;
        }
    }
    async addComment(noteId, text, commentById) {
        return this.prisma.noteComment.create({
            data: {
                noteId,
                text,
                commentById,
            },
            include: {
                commentBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }
    async markAsRead(noteId, employeeId) {
        return this.prisma.noteReadReceipt.upsert({
            where: {
                noteId_employeeId: { noteId, employeeId },
            },
            create: {
                noteId,
                employeeId,
            },
            update: {
                readAt: new Date(),
            },
        });
    }
    async archive(id) {
        return this.update(id, { archived: true });
    }
    async unarchive(id) {
        return this.update(id, { archived: false });
    }
    async pin(id) {
        return this.update(id, { pinned: true });
    }
    async unpin(id) {
        return this.update(id, { pinned: false });
    }
    async remove(id) {
        try {
            return await this.prisma.note.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Note with ID ${id} not found`);
            }
            throw error;
        }
    }
    async getPinnedNotes() {
        return this.prisma.note.findMany({
            where: { pinned: true, archived: false },
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }
    async getFollowUpDue() {
        return this.prisma.note.findMany({
            where: {
                requiresFollowUp: true,
                followUpCompleted: false,
                followUpDate: { lte: new Date() },
            },
            orderBy: { followUpDate: 'asc' },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                followUpAssignedTo: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], NotesService);
//# sourceMappingURL=notes.service.js.map
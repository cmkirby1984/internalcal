import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateNoteDto, UpdateNoteDto, FilterNotesDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNoteDto: CreateNoteDto, createdById: string) {
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

  async findAll(filters: FilterNotesDto, userId?: string) {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      relatedSuiteId,
      relatedTaskId,
      createdById,
      showArchived,
      pinnedOnly,
      search,
      tag,
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.NoteWhereInput = {};

    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (relatedSuiteId) where.relatedSuiteId = relatedSuiteId;
    if (relatedTaskId) where.relatedTaskId = relatedTaskId;
    if (createdById) where.createdById = createdById;
    if (!showArchived) where.archived = false;
    if (pinnedOnly) where.pinned = true;
    if (tag) where.tags = { has: tag };

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

  async findOne(id: string) {
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
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    return note;
  }

  async update(id: string, updateNoteDto: UpdateNoteDto) {
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Note with ID ${id} not found`);
      }
      throw error;
    }
  }

  async addComment(noteId: string, text: string, commentById: string) {
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

  async markAsRead(noteId: string, employeeId: string) {
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

  async archive(id: string) {
    return this.update(id, { archived: true });
  }

  async unarchive(id: string) {
    return this.update(id, { archived: false });
  }

  async pin(id: string) {
    return this.update(id, { pinned: true });
  }

  async unpin(id: string) {
    return this.update(id, { pinned: false });
  }

  async remove(id: string) {
    try {
      return await this.prisma.note.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Note with ID ${id} not found`);
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
}

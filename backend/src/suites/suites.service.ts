import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateSuiteDto, UpdateSuiteDto, FilterSuitesDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSuiteDto: CreateSuiteDto) {
    try {
      const { currentGuest, ...rest } = createSuiteDto;
      return await this.prisma.suite.create({
        data: {
          ...rest,
          amenities: createSuiteDto.amenities ?? [],
          currentGuest: currentGuest as any,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Suite with number ${createSuiteDto.suiteNumber} already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(filters: FilterSuitesDto) {
    const { page = 1, limit = 20, status, type, floor, search, sortBy, sortOrder } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.SuiteWhereInput = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (floor) where.floor = floor;
    if (search) {
      where.OR = [
        { suiteNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.SuiteOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.suiteNumber = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.suite.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          tasks: {
            where: {
              status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
            },
            select: { id: true, type: true, status: true, priority: true },
          },
        },
      }),
      this.prisma.suite.count({ where }),
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
    const suite = await this.prisma.suite.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        maintenanceRecords: {
          orderBy: { performedAt: 'desc' },
          take: 5,
        },
        relatedNotes: {
          where: { archived: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!suite) {
      throw new NotFoundException(`Suite with ID ${id} not found`);
    }

    return suite;
  }

  async findByNumber(suiteNumber: string) {
    const suite = await this.prisma.suite.findUnique({
      where: { suiteNumber },
    });

    if (!suite) {
      throw new NotFoundException(`Suite ${suiteNumber} not found`);
    }

    return suite;
  }

  async update(id: string, updateSuiteDto: UpdateSuiteDto) {
    try {
      const { currentGuest, ...rest } = updateSuiteDto;
      return await this.prisma.suite.update({
        where: { id },
        data: {
          ...rest,
          ...(currentGuest !== undefined && { currentGuest: currentGuest as any }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Suite with ID ${id} not found`);
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: string) {
    return this.update(id, { status: status as any });
  }

  async remove(id: string) {
    try {
      return await this.prisma.suite.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Suite with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Statistics for dashboard
  async getStats() {
    const [
      total,
      vacantClean,
      vacantDirty,
      occupiedClean,
      occupiedDirty,
      outOfOrder,
      blocked,
    ] = await Promise.all([
      this.prisma.suite.count(),
      this.prisma.suite.count({ where: { status: 'VACANT_CLEAN' } }),
      this.prisma.suite.count({ where: { status: 'VACANT_DIRTY' } }),
      this.prisma.suite.count({ where: { status: 'OCCUPIED_CLEAN' } }),
      this.prisma.suite.count({ where: { status: 'OCCUPIED_DIRTY' } }),
      this.prisma.suite.count({ where: { status: 'OUT_OF_ORDER' } }),
      this.prisma.suite.count({ where: { status: 'BLOCKED' } }),
    ]);

    const occupied = occupiedClean + occupiedDirty;
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

    return {
      total,
      vacantClean,
      vacantDirty,
      occupiedClean,
      occupiedDirty,
      outOfOrder,
      blocked,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      needsCleaning: vacantDirty + occupiedDirty,
    };
  }
}


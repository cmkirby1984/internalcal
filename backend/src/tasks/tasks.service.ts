import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma';
import { CreateTaskDto, UpdateTaskDto, FilterTasksDto } from './dto';
import { Prisma, TaskStatus } from '@prisma/client';
import {
  TaskCreatedEvent,
  TaskAssignedEvent,
  TaskCompletedEvent,
  TaskStatusChangedEvent,
  EmergencyTaskCreatedEvent,
  DomainEventNames,
} from '../domain/events';
import { TaskStatusService } from '../domain/status';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly taskStatusService: TaskStatusService,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    // Validate suite exists if provided
    if (createTaskDto.suiteId) {
      const suite = await this.prisma.suite.findUnique({
        where: { id: createTaskDto.suiteId },
      });
      if (!suite) {
        throw new BadRequestException('Suite not found');
      }
    }

    // Validate assigned employee exists if provided
    if (createTaskDto.assignedToId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: createTaskDto.assignedToId },
      });
      if (!employee) {
        throw new BadRequestException('Assigned employee not found');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        attachedPhotos: createTaskDto.attachedPhotos ?? [],
        status: createTaskDto.assignedToId
          ? TaskStatus.ASSIGNED
          : (createTaskDto.status ?? TaskStatus.PENDING),
      },
      include: {
        suite: { select: { id: true, suiteNumber: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Emit task created event
    this.eventEmitter.emit(
      DomainEventNames.TASK_CREATED,
      new TaskCreatedEvent(
        task.id,
        task.title,
        task.type,
        task.priority,
        task.suiteId ?? undefined,
        task.suite?.suiteNumber,
        task.assignedToId ?? undefined,
        createTaskDto.assignedById,
      ),
    );

    // Emit emergency event if applicable
    if (task.priority === 'EMERGENCY' || task.type === 'EMERGENCY') {
      this.eventEmitter.emit(
        DomainEventNames.TASK_EMERGENCY_CREATED,
        new EmergencyTaskCreatedEvent(
          task.id,
          task.title,
          task.suiteId ?? undefined,
          task.suite?.suiteNumber,
          task.description ?? undefined,
          createTaskDto.assignedById,
        ),
      );
    }

    return task;
  }

  async findAll(filters: FilterTasksDto) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        priority,
        assignedToId,
        suiteId,
        scheduledAfter,
        scheduledBefore,
        search,
        sortBy,
        sortOrder,
      } = filters;
      const skip = (page - 1) * limit;

      const where: Prisma.TaskWhereInput = {};

      if (status) where.status = status;
      if (type) where.type = type;
      if (priority) where.priority = priority;
      if (assignedToId) where.assignedToId = assignedToId;
      if (suiteId) where.suiteId = suiteId;

      if (scheduledAfter || scheduledBefore) {
        where.scheduledStart = {};
        if (scheduledAfter) where.scheduledStart.gte = new Date(scheduledAfter);
        if (scheduledBefore)
          where.scheduledStart.lte = new Date(scheduledBefore);
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const orderBy: Prisma.TaskOrderByWithRelationInput = {};
      if (sortBy) {
        orderBy[sortBy] = sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const [data, total] = await Promise.all([
        this.prisma.task.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            suite: { select: { id: true, suiteNumber: true } },
            assignedTo: {
              select: { id: true, firstName: true, lastName: true },
            },
            assignedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        }),
        this.prisma.task.count({ where }),
      ]);

      this.logger.log(
        `Found ${total} tasks with filters: ${JSON.stringify(filters)}`,
      );

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch tasks: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to load tasks.');
    }
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        suite: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        verifiedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        subtasks: true,
        relatedNotes: {
          where: { archived: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async findBySuite(suiteId: string) {
    return this.prisma.task.findMany({
      where: { suiteId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findByEmployee(employeeId: string, activeOnly = false) {
    const where: Prisma.TaskWhereInput = { assignedToId: employeeId };

    if (activeOnly) {
      where.status = { in: ['ASSIGNED', 'IN_PROGRESS', 'PAUSED'] };
    }

    return this.prisma.task.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { scheduledStart: 'asc' }],
      include: {
        suite: { select: { id: true, suiteNumber: true } },
      },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    try {
      return await this.prisma.task.update({
        where: { id },
        data: updateTaskDto,
        include: {
          suite: { select: { id: true, suiteNumber: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: TaskStatus, userId?: string) {
    const task = await this.findOne(id);
    const previousStatus = task.status;

    // Validate status transition
    this.taskStatusService.assertValidTransition(previousStatus, status, {
      assignedTo: task.assignedToId,
      actualStart: task.actualStart,
      actualEnd: status === TaskStatus.COMPLETED ? new Date() : task.actualEnd,
      verifiedBy: userId,
    });

    const now = new Date();
    const updates: Prisma.TaskUpdateInput = { status };

    // Apply status-specific updates
    switch (status) {
      case TaskStatus.IN_PROGRESS:
        if (!task.actualStart) {
          updates.actualStart = now;
        }
        break;
      case TaskStatus.COMPLETED:
        updates.actualEnd = now;
        updates.completedAt = now;
        if (task.actualStart) {
          updates.actualDuration = Math.round(
            (now.getTime() - task.actualStart.getTime()) / 60000,
          );
        }
        break;
      case TaskStatus.VERIFIED:
        if (userId) {
          updates.verifiedBy = { connect: { id: userId } };
        }
        break;
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updates,
      include: {
        suite: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Emit status changed event
    this.eventEmitter.emit(
      DomainEventNames.TASK_STATUS_CHANGED,
      new TaskStatusChangedEvent(
        task.id,
        task.title,
        previousStatus,
        status,
        task.suiteId ?? undefined,
        userId,
      ),
    );

    // Emit completed event if applicable (triggers suite status update via listener)
    if (status === TaskStatus.COMPLETED) {
      this.eventEmitter.emit(
        DomainEventNames.TASK_COMPLETED,
        new TaskCompletedEvent(
          task.id,
          task.title,
          task.type,
          task.suiteId ?? undefined,
          task.suite?.suiteNumber,
          task.assignedToId ?? undefined,
          updatedTask.actualDuration ?? undefined,
        ),
      );
    }

    return updatedTask;
  }

  async assignTask(id: string, employeeId: string, assignedById?: string) {
    const task = await this.findOne(id);
    const previousAssigneeId = task.assignedToId;

    // Validate employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        assignedToId: employeeId,
        assignedById: assignedById,
        status: TaskStatus.ASSIGNED,
      },
      include: {
        suite: { select: { id: true, suiteNumber: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Emit task assigned event
    this.eventEmitter.emit(
      DomainEventNames.TASK_ASSIGNED,
      new TaskAssignedEvent(
        task.id,
        task.title,
        employeeId,
        `${employee.firstName} ${employee.lastName}`,
        assignedById,
        previousAssigneeId ?? undefined,
      ),
    );

    return updatedTask;
  }

  async remove(id: string) {
    try {
      return await this.prisma.task.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Statistics for dashboard
  async getStats() {
    const now = new Date();

    const [
      total,
      pending,
      assigned,
      inProgress,
      completed,
      overdue,
      completedToday,
    ] = await Promise.all([
      this.prisma.task.count(),
      this.prisma.task.count({ where: { status: 'PENDING' } }),
      this.prisma.task.count({ where: { status: 'ASSIGNED' } }),
      this.prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { status: 'COMPLETED' } }),
      this.prisma.task.count({
        where: {
          scheduledEnd: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED', 'VERIFIED'] },
        },
      }),
      this.prisma.task.count({
        where: {
          completedAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      total,
      pending,
      assigned,
      inProgress,
      completed,
      overdue,
      completedToday,
    };
  }
}

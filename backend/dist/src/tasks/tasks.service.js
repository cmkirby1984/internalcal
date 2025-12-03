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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
const events_1 = require("../domain/events");
const status_1 = require("../domain/status");
let TasksService = class TasksService {
    prisma;
    eventEmitter;
    taskStatusService;
    constructor(prisma, eventEmitter, taskStatusService) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.taskStatusService = taskStatusService;
    }
    async create(createTaskDto) {
        if (createTaskDto.suiteId) {
            const suite = await this.prisma.suite.findUnique({
                where: { id: createTaskDto.suiteId },
            });
            if (!suite) {
                throw new common_1.BadRequestException('Suite not found');
            }
        }
        if (createTaskDto.assignedToId) {
            const employee = await this.prisma.employee.findUnique({
                where: { id: createTaskDto.assignedToId },
            });
            if (!employee) {
                throw new common_1.BadRequestException('Assigned employee not found');
            }
        }
        const task = await this.prisma.task.create({
            data: {
                ...createTaskDto,
                attachedPhotos: createTaskDto.attachedPhotos ?? [],
                status: createTaskDto.assignedToId
                    ? client_1.TaskStatus.ASSIGNED
                    : (createTaskDto.status ?? client_1.TaskStatus.PENDING),
            },
            include: {
                suite: { select: { id: true, suiteNumber: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        this.eventEmitter.emit(events_1.DomainEventNames.TASK_CREATED, new events_1.TaskCreatedEvent(task.id, task.title, task.type, task.priority, task.suiteId ?? undefined, task.suite?.suiteNumber, task.assignedToId ?? undefined, createTaskDto.assignedById));
        if (task.priority === 'EMERGENCY' || task.type === 'EMERGENCY') {
            this.eventEmitter.emit(events_1.DomainEventNames.TASK_EMERGENCY_CREATED, new events_1.EmergencyTaskCreatedEvent(task.id, task.title, task.suiteId ?? undefined, task.suite?.suiteNumber, task.description ?? undefined, createTaskDto.assignedById));
        }
        return task;
    }
    async findAll(filters) {
        const { page = 1, limit = 20, status, type, priority, assignedToId, suiteId, scheduledAfter, scheduledBefore, search, sortBy, sortOrder, } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        if (priority)
            where.priority = priority;
        if (assignedToId)
            where.assignedToId = assignedToId;
        if (suiteId)
            where.suiteId = suiteId;
        if (scheduledAfter || scheduledBefore) {
            where.scheduledStart = {};
            if (scheduledAfter)
                where.scheduledStart.gte = new Date(scheduledAfter);
            if (scheduledBefore)
                where.scheduledStart.lte = new Date(scheduledBefore);
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const orderBy = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'desc';
        }
        else {
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
                    assignedTo: { select: { id: true, firstName: true, lastName: true } },
                    assignedBy: { select: { id: true, firstName: true, lastName: true } },
                },
            }),
            this.prisma.task.count({ where }),
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
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        return task;
    }
    async findBySuite(suiteId) {
        return this.prisma.task.findMany({
            where: { suiteId },
            orderBy: { createdAt: 'desc' },
            include: {
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async findByEmployee(employeeId, activeOnly = false) {
        const where = { assignedToId: employeeId };
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
    async update(id, updateTaskDto) {
        try {
            return await this.prisma.task.update({
                where: { id },
                data: updateTaskDto,
                include: {
                    suite: { select: { id: true, suiteNumber: true } },
                    assignedTo: { select: { id: true, firstName: true, lastName: true } },
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Task with ID ${id} not found`);
            }
            throw error;
        }
    }
    async updateStatus(id, status, userId) {
        const task = await this.findOne(id);
        const previousStatus = task.status;
        this.taskStatusService.assertValidTransition(previousStatus, status, {
            assignedTo: task.assignedToId,
            actualStart: task.actualStart,
            actualEnd: status === client_1.TaskStatus.COMPLETED ? new Date() : task.actualEnd,
            verifiedBy: userId,
        });
        const now = new Date();
        const updates = { status };
        switch (status) {
            case client_1.TaskStatus.IN_PROGRESS:
                if (!task.actualStart) {
                    updates.actualStart = now;
                }
                break;
            case client_1.TaskStatus.COMPLETED:
                updates.actualEnd = now;
                updates.completedAt = now;
                if (task.actualStart) {
                    updates.actualDuration = Math.round((now.getTime() - task.actualStart.getTime()) / 60000);
                }
                break;
            case client_1.TaskStatus.VERIFIED:
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
        this.eventEmitter.emit(events_1.DomainEventNames.TASK_STATUS_CHANGED, new events_1.TaskStatusChangedEvent(task.id, task.title, previousStatus, status, task.suiteId ?? undefined, userId));
        if (status === client_1.TaskStatus.COMPLETED) {
            this.eventEmitter.emit(events_1.DomainEventNames.TASK_COMPLETED, new events_1.TaskCompletedEvent(task.id, task.title, task.type, task.suiteId ?? undefined, task.suite?.suiteNumber, task.assignedToId ?? undefined, updatedTask.actualDuration ?? undefined));
        }
        return updatedTask;
    }
    async assignTask(id, employeeId, assignedById) {
        const task = await this.findOne(id);
        const previousAssigneeId = task.assignedToId;
        const employee = await this.prisma.employee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            throw new common_1.BadRequestException('Employee not found');
        }
        const updatedTask = await this.prisma.task.update({
            where: { id },
            data: {
                assignedToId: employeeId,
                assignedById: assignedById,
                status: client_1.TaskStatus.ASSIGNED,
            },
            include: {
                suite: { select: { id: true, suiteNumber: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        this.eventEmitter.emit(events_1.DomainEventNames.TASK_ASSIGNED, new events_1.TaskAssignedEvent(task.id, task.title, employeeId, `${employee.firstName} ${employee.lastName}`, assignedById, previousAssigneeId ?? undefined));
        return updatedTask;
    }
    async remove(id) {
        try {
            return await this.prisma.task.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Task with ID ${id} not found`);
            }
            throw error;
        }
    }
    async getStats() {
        const now = new Date();
        const [total, pending, assigned, inProgress, completed, overdue, completedToday,] = await Promise.all([
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
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        event_emitter_1.EventEmitter2,
        status_1.TaskStatusService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map
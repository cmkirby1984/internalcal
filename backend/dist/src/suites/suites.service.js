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
exports.SuitesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
let SuitesService = class SuitesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createSuiteDto) {
        try {
            const { currentGuest, ...rest } = createSuiteDto;
            return await this.prisma.suite.create({
                data: {
                    ...rest,
                    amenities: createSuiteDto.amenities ?? [],
                    currentGuest: currentGuest,
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`Suite with number ${createSuiteDto.suiteNumber} already exists`);
            }
            throw error;
        }
    }
    async findAll(filters) {
        const { page = 1, limit = 20, status, type, floor, search, sortBy, sortOrder } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        if (floor)
            where.floor = floor;
        if (search) {
            where.OR = [
                { suiteNumber: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
            ];
        }
        const orderBy = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'asc';
        }
        else {
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Suite with ID ${id} not found`);
        }
        return suite;
    }
    async findByNumber(suiteNumber) {
        const suite = await this.prisma.suite.findUnique({
            where: { suiteNumber },
        });
        if (!suite) {
            throw new common_1.NotFoundException(`Suite ${suiteNumber} not found`);
        }
        return suite;
    }
    async update(id, updateSuiteDto) {
        try {
            const { currentGuest, ...rest } = updateSuiteDto;
            return await this.prisma.suite.update({
                where: { id },
                data: {
                    ...rest,
                    ...(currentGuest !== undefined && { currentGuest: currentGuest }),
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Suite with ID ${id} not found`);
            }
            throw error;
        }
    }
    async updateStatus(id, status) {
        return this.update(id, { status: status });
    }
    async remove(id) {
        try {
            return await this.prisma.suite.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Suite with ID ${id} not found`);
            }
            throw error;
        }
    }
    async getStats() {
        const [total, vacantClean, vacantDirty, occupiedClean, occupiedDirty, outOfOrder, blocked,] = await Promise.all([
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
};
exports.SuitesService = SuitesService;
exports.SuitesService = SuitesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], SuitesService);
//# sourceMappingURL=suites.service.js.map
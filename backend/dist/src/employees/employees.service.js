"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
let EmployeesService = class EmployeesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createEmployeeDto) {
        const { password, ...rest } = createEmployeeDto;
        const passwordHash = await argon2.hash(password);
        try {
            const employee = await this.prisma.employee.create({
                data: {
                    ...rest,
                    passwordHash,
                    permissions: rest.permissions ?? this.getDefaultPermissions(rest.role),
                },
                select: this.getSelectFields(),
            });
            return employee;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                const target = error.meta?.target || [];
                if (target.includes('email')) {
                    throw new common_1.ConflictException('Email already exists');
                }
                if (target.includes('username')) {
                    throw new common_1.ConflictException('Username already exists');
                }
                if (target.includes('employeeNumber')) {
                    throw new common_1.ConflictException('Employee number already exists');
                }
            }
            throw error;
        }
    }
    getDefaultPermissions(role) {
        const permissionsMap = {
            HOUSEKEEPER: ['view_assigned_tasks', 'update_task_status', 'add_notes'],
            MAINTENANCE: [
                'view_assigned_tasks',
                'update_task_status',
                'add_maintenance_notes',
                'update_suite_status',
            ],
            FRONT_DESK: [
                'view_all_suites',
                'update_suite_status',
                'view_all_tasks',
                'add_notes',
            ],
            SUPERVISOR: [
                'view_all_tasks',
                'assign_tasks',
                'view_all_suites',
                'add_tasks',
                'view_employees',
            ],
            MANAGER: ['*'],
            ADMIN: ['*'],
        };
        return permissionsMap[role] || [];
    }
    getSelectFields() {
        return {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            department: true,
            status: true,
            username: true,
            permissions: true,
            currentShift: true,
            isOnDuty: true,
            lastClockIn: true,
            lastClockOut: true,
            currentLocation: true,
            tasksCompleted: true,
            averageTaskDuration: true,
            performanceRating: true,
            preferredContactMethod: true,
            emergencyContact: true,
            hireDate: true,
            createdAt: true,
            updatedAt: true,
            lastActive: true,
        };
    }
    async findAll(filters) {
        const { page = 1, limit = 20, status, role, department, isOnDuty, search } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (role)
            where.role = role;
        if (department)
            where.department = department;
        if (isOnDuty !== undefined)
            where.isOnDuty = isOnDuty;
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { employeeNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.employee.findMany({
                where,
                skip,
                take: limit,
                orderBy: { lastName: 'asc' },
                select: this.getSelectFields(),
            }),
            this.prisma.employee.count({ where }),
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
        const employee = await this.prisma.employee.findUnique({
            where: { id },
            select: {
                ...this.getSelectFields(),
                assignedTasks: {
                    where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'PAUSED'] } },
                    orderBy: { priority: 'desc' },
                    include: {
                        suite: { select: { id: true, suiteNumber: true } },
                    },
                },
            },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with ID ${id} not found`);
        }
        return employee;
    }
    async findByUsername(username) {
        return this.prisma.employee.findUnique({
            where: { username },
        });
    }
    async findByEmail(email) {
        return this.prisma.employee.findUnique({
            where: { email },
        });
    }
    async update(id, updateEmployeeDto) {
        try {
            return await this.prisma.employee.update({
                where: { id },
                data: updateEmployeeDto,
                select: this.getSelectFields(),
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Employee with ID ${id} not found`);
            }
            throw error;
        }
    }
    async clockIn(id) {
        return this.prisma.employee.update({
            where: { id },
            data: {
                isOnDuty: true,
                lastClockIn: new Date(),
                status: 'ACTIVE',
                lastActive: new Date(),
            },
            select: this.getSelectFields(),
        });
    }
    async clockOut(id) {
        return this.prisma.employee.update({
            where: { id },
            data: {
                isOnDuty: false,
                lastClockOut: new Date(),
                status: 'OFF_DUTY',
                lastActive: new Date(),
            },
            select: this.getSelectFields(),
        });
    }
    async updateStatus(id, status) {
        return this.prisma.employee.update({
            where: { id },
            data: {
                status: status,
                lastActive: new Date(),
            },
            select: this.getSelectFields(),
        });
    }
    async remove(id) {
        try {
            return await this.prisma.employee.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`Employee with ID ${id} not found`);
            }
            throw error;
        }
    }
    async getOnDutyEmployees() {
        return this.prisma.employee.findMany({
            where: { isOnDuty: true },
            select: this.getSelectFields(),
        });
    }
    async getAvailableEmployees() {
        return this.prisma.employee.findMany({
            where: {
                isOnDuty: true,
                assignedTasks: {
                    none: { status: 'IN_PROGRESS' },
                },
            },
            select: this.getSelectFields(),
        });
    }
    async getStats() {
        const [total, onDuty, available, byDepartment, byRole] = await Promise.all([
            this.prisma.employee.count({ where: { status: { not: 'INACTIVE' } } }),
            this.prisma.employee.count({ where: { isOnDuty: true } }),
            this.prisma.employee.count({
                where: {
                    isOnDuty: true,
                    assignedTasks: { none: { status: 'IN_PROGRESS' } },
                },
            }),
            this.prisma.employee.groupBy({
                by: ['department'],
                _count: true,
                where: { status: { not: 'INACTIVE' } },
            }),
            this.prisma.employee.groupBy({
                by: ['role'],
                _count: true,
                where: { status: { not: 'INACTIVE' } },
            }),
        ]);
        return {
            total,
            onDuty,
            available,
            byDepartment: byDepartment.reduce((acc, curr) => ({ ...acc, [curr.department]: curr._count }), {}),
            byRole: byRole.reduce((acc, curr) => ({ ...acc, [curr.role]: curr._count }), {}),
        };
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map
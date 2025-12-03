import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateEmployeeDto, UpdateEmployeeDto, FilterEmployeesDto } from './dto';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { password, ...rest } = createEmployeeDto;

    // Hash password
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
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes('email')) {
          throw new ConflictException('Email already exists');
        }
        if (target.includes('username')) {
          throw new ConflictException('Username already exists');
        }
        if (target.includes('employeeNumber')) {
          throw new ConflictException('Employee number already exists');
        }
      }
      throw error;
    }
  }

  private getDefaultPermissions(role: string): string[] {
    const permissionsMap: Record<string, string[]> = {
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

  private getSelectFields() {
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

  async findAll(filters: FilterEmployeesDto) {
    const { page = 1, limit = 20, status, role, department, isOnDuty, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {};

    if (status) where.status = status;
    if (role) where.role = role;
    if (department) where.department = department;
    if (isOnDuty !== undefined) where.isOnDuty = isOnDuty;
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

  async findOne(id: string) {
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
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async findByUsername(username: string) {
    return this.prisma.employee.findUnique({
      where: { username },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.employee.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    try {
      return await this.prisma.employee.update({
        where: { id },
        data: updateEmployeeDto,
        select: this.getSelectFields(),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }
      throw error;
    }
  }

  async clockIn(id: string) {
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

  async clockOut(id: string) {
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

  async updateStatus(id: string, status: string) {
    return this.prisma.employee.update({
      where: { id },
      data: {
        status: status as any,
        lastActive: new Date(),
      },
      select: this.getSelectFields(),
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.employee.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Employee with ID ${id} not found`);
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
    // On duty and not currently working on any in-progress task
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
      byDepartment: byDepartment.reduce(
        (acc, curr) => ({ ...acc, [curr.department]: curr._count }),
        {},
      ),
      byRole: byRole.reduce(
        (acc, curr) => ({ ...acc, [curr.role]: curr._count }),
        {},
      ),
    };
  }
}


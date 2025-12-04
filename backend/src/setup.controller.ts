import { Controller, Post } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as argon2 from 'argon2';

@Controller('setup')
export class SetupController {
  constructor(private prisma: PrismaService) {}

  @Post('create-admin')
  async createAdmin() {
    // Check if admin already exists
    const existingAdmin = await this.prisma.employee.findUnique({
      where: { username: 'admin' },
    });

    if (existingAdmin) {
      return {
        success: false,
        message: 'Admin user already exists',
        username: 'admin',
      };
    }

    // Create admin user
    const adminPassword = await argon2.hash('admin123');
    const admin = await this.prisma.employee.create({
      data: {
        employeeNumber: 'EMP001',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@motel.com',
        phone: '+1234567890',
        role: 'ADMIN',
        department: 'MANAGEMENT',
        status: 'ACTIVE',
        username: 'admin',
        passwordHash: adminPassword,
        permissions: ['*'],
        isOnDuty: true,
        hireDate: new Date('2024-01-01'),
      },
    });

    return {
      success: true,
      message: 'Admin user created successfully!',
      username: admin.username,
      password: 'admin123',
      instructions: 'You can now login with username: admin, password: admin123',
    };
  }
}

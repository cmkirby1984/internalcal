import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmployeesService } from '../employees/employees.service';
import { LoginDto } from './dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const employee = await this.employeesService.findByUsername(username);

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (employee.status === 'INACTIVE') {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await argon2.verify(employee.passwordHash, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return employee;
  }

  async login(loginDto: LoginDto) {
    const employee = await this.validateUser(loginDto.username, loginDto.password);

    const payload = {
      sub: employee.id,
      username: employee.username,
      role: employee.role,
      permissions: employee.permissions,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: employee.id,
        username: employee.username,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role,
        permissions: employee.permissions,
      },
    };
  }

  async getProfile(userId: string) {
    return this.employeesService.findOne(userId);
  }
}


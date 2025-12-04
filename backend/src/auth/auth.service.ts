import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmployeesService } from '../employees/employees.service';
import { LoginDto } from './dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string) {
    const employee = await this.employeesService.findByUsername(username);

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (employee.status === 'INACTIVE') {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await argon2.verify(
      employee.passwordHash,
      password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return employee;
  }

  async login(loginDto: LoginDto) {
    const employee = await this.validateUser(
      loginDto.username,
      loginDto.password,
    );

    const payload = {
      sub: employee.id,
      username: employee.username,
      role: employee.role,
      permissions: employee.permissions,
    };

    const refreshPayload = {
      sub: employee.id,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: refreshExpiresIn as string & { __brand: 'StringValue' },
    } as any);

    return {
      token: accessToken,
      refreshToken,
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

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const employee = await this.employeesService.findOne(decoded.sub);

      if (!employee || employee.status === 'INACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }

      const payload = {
        sub: employee.id,
        username: employee.username,
        role: employee.role,
        permissions: employee.permissions,
      };

      const refreshPayload = {
        sub: employee.id,
        type: 'refresh',
      };

      const newAccessToken = this.jwtService.sign(payload);
      const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
      const newRefreshToken = this.jwtService.sign(refreshPayload, {
        expiresIn: refreshExpiresIn as string & { __brand: 'StringValue' },
      } as any);

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    return this.employeesService.findOne(userId);
  }
}

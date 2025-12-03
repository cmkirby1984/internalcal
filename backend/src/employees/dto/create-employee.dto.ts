import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  MinLength,
  IsPhoneNumber,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmployeeRole,
  Department,
  EmployeeStatus,
  ContactMethod,
} from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP001' })
  @IsString()
  employeeNumber: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'john.doe@motel.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: EmployeeRole })
  @IsEnum(EmployeeRole)
  role: EmployeeRole;

  @ApiProperty({ enum: Department })
  @IsEnum(Department)
  department: Department;

  @ApiPropertyOptional({ enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'securepassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  currentShift?: Record<string, any>;

  @ApiPropertyOptional({ enum: ContactMethod, default: ContactMethod.IN_APP })
  @IsOptional()
  @IsEnum(ContactMethod)
  preferredContactMethod?: ContactMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  emergencyContact?: Record<string, any>;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  hireDate: string;
}


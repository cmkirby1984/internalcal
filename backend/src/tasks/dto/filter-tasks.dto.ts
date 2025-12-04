import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType, TaskPriority, TaskStatus } from '@prisma/client';
import { PaginationDto } from '../../common';

export class FilterTasksDto extends PaginationDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskType })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  suiteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAfter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledBefore?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['createdAt', 'scheduledStart', 'priority', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'scheduledStart' | 'priority' | 'status';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

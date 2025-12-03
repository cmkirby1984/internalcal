import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  completionNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verificationNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualEnd?: string;
}


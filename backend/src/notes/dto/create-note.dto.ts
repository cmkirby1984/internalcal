import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteType, NotePriority, NoteVisibility } from '@prisma/client';

export class CreateNoteDto {
  @ApiPropertyOptional({ enum: NoteType, default: NoteType.GENERAL })
  @IsOptional()
  @IsEnum(NoteType)
  type?: NoteType;

  @ApiPropertyOptional({ enum: NotePriority, default: NotePriority.NORMAL })
  @IsOptional()
  @IsEnum(NotePriority)
  priority?: NotePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relatedSuiteId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relatedTaskId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relatedEmployeeId?: string;

  @ApiPropertyOptional({
    enum: NoteVisibility,
    default: NoteVisibility.ALL_STAFF,
  })
  @IsOptional()
  @IsEnum(NoteVisibility)
  visibility?: NoteVisibility;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresFollowUp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  followUpAssignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

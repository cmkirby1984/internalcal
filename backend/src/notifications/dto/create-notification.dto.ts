import {
  IsString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotePriority } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  recipientId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: NotePriority, default: NotePriority.NORMAL })
  @IsOptional()
  @IsEnum(NotePriority)
  priority?: NotePriority;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  actionRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}


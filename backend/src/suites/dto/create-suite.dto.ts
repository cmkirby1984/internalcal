import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SuiteType,
  SuiteStatus,
  BedConfiguration,
} from '@prisma/client';

export class CurrentGuestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  checkInDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  checkOutDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class CreateSuiteDto {
  @ApiProperty({ example: '101' })
  @IsString()
  suiteNumber: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  floor: number;

  @ApiProperty({ enum: SuiteType })
  @IsEnum(SuiteType)
  type: SuiteType;

  @ApiPropertyOptional({ enum: SuiteStatus, default: SuiteStatus.VACANT_CLEAN })
  @IsOptional()
  @IsEnum(SuiteStatus)
  status?: SuiteStatus;

  @ApiPropertyOptional({ type: CurrentGuestDto })
  @IsOptional()
  @IsObject()
  currentGuest?: CurrentGuestDto;

  @ApiProperty({ enum: BedConfiguration })
  @IsEnum(BedConfiguration)
  bedConfiguration: BedConfiguration;

  @ApiPropertyOptional({ type: [String], example: ['WiFi', 'Mini-Fridge'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsInt()
  @Min(1)
  squareFeet?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}


import { IsOptional, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SuiteStatus, SuiteType } from '@prisma/client';
import { PaginationDto } from '../../common';

export class FilterSuitesDto extends PaginationDto {
  @ApiPropertyOptional({ enum: SuiteStatus })
  @IsOptional()
  @IsEnum(SuiteStatus)
  status?: SuiteStatus;

  @ApiPropertyOptional({ enum: SuiteType })
  @IsOptional()
  @IsEnum(SuiteType)
  type?: SuiteType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  floor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['suiteNumber', 'status', 'floor', 'lastCleaned'],
    default: 'suiteNumber',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'suiteNumber' | 'status' | 'floor' | 'lastCleaned';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

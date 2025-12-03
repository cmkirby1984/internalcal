import { SuiteStatus, SuiteType } from '@prisma/client';
import { PaginationDto } from '../../common';
export declare class FilterSuitesDto extends PaginationDto {
    status?: SuiteStatus;
    type?: SuiteType;
    floor?: number;
    search?: string;
    sortBy?: 'suiteNumber' | 'status' | 'floor' | 'lastCleaned';
    sortOrder?: 'asc' | 'desc';
}

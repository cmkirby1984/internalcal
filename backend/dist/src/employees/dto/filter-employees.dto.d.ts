import { EmployeeRole, Department, EmployeeStatus } from '@prisma/client';
import { PaginationDto } from '../../common';
export declare class FilterEmployeesDto extends PaginationDto {
    status?: EmployeeStatus;
    role?: EmployeeRole;
    department?: Department;
    isOnDuty?: boolean;
    search?: string;
}

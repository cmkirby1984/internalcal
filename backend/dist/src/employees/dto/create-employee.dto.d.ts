import { EmployeeRole, Department, EmployeeStatus, ContactMethod } from '@prisma/client';
export declare class CreateEmployeeDto {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: EmployeeRole;
    department: Department;
    status?: EmployeeStatus;
    username: string;
    password: string;
    permissions?: string[];
    currentShift?: Record<string, any>;
    preferredContactMethod?: ContactMethod;
    emergencyContact?: Record<string, any>;
    hireDate: string;
}

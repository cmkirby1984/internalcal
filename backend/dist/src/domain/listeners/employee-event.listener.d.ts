import { PrismaService } from '../../prisma';
import { EmployeeClockInEvent, EmployeeClockOutEvent } from '../events';
export declare class EmployeeEventListener {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleEmployeeClockIn(event: EmployeeClockInEvent): Promise<void>;
    handleEmployeeClockOut(event: EmployeeClockOutEvent): Promise<void>;
}

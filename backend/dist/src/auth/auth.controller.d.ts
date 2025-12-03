import { AuthService } from './auth.service';
import { LoginDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
            email: string;
            role: import(".prisma/client").$Enums.EmployeeRole;
            permissions: string[];
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        employeeNumber: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.EmployeeRole;
        department: import(".prisma/client").$Enums.Department;
        status: import(".prisma/client").$Enums.EmployeeStatus;
        permissions: string[];
        currentShift: import("@prisma/client/runtime/library").JsonValue;
        isOnDuty: boolean;
        lastClockIn: Date | null;
        lastClockOut: Date | null;
        currentLocation: string | null;
        tasksCompleted: number;
        averageTaskDuration: number | null;
        performanceRating: import("@prisma/client/runtime/library").Decimal | null;
        preferredContactMethod: import(".prisma/client").$Enums.ContactMethod;
        emergencyContact: import("@prisma/client/runtime/library").JsonValue;
        hireDate: Date;
        createdAt: Date;
        updatedAt: Date;
        lastActive: Date | null;
        assignedTasks: ({
            suite: {
                id: string;
                suiteNumber: string;
            } | null;
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TaskStatus;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TaskType;
            priority: import(".prisma/client").$Enums.TaskPriority;
            title: string;
            description: string | null;
            scheduledStart: Date | null;
            scheduledEnd: Date | null;
            estimatedDuration: number | null;
            actualStart: Date | null;
            actualEnd: Date | null;
            actualDuration: number | null;
            completionNotes: string | null;
            verificationNotes: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue | null;
            recurring: boolean;
            recurrencePattern: import("@prisma/client/runtime/library").JsonValue | null;
            completedAt: Date | null;
            attachedPhotos: string[];
            assignedToId: string | null;
            assignedById: string | null;
            suiteId: string | null;
            verifiedById: string | null;
            parentTaskId: string | null;
        })[];
    }>;
    getMe(user: any): any;
}

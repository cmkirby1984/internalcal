import { PrismaService } from '../../prisma';
import { SuiteStatusService } from '../status';
import { TaskCompletedEvent, TaskAssignedEvent, EmergencyTaskCreatedEvent } from '../events';
export declare class TaskEventListener {
    private readonly prisma;
    private readonly suiteStatusService;
    private readonly logger;
    constructor(prisma: PrismaService, suiteStatusService: SuiteStatusService);
    handleTaskCompleted(event: TaskCompletedEvent): Promise<void>;
    handleTaskAssigned(event: TaskAssignedEvent): Promise<void>;
    handleEmergencyTask(event: EmergencyTaskCreatedEvent): Promise<void>;
}

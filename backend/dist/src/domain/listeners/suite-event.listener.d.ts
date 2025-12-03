import { PrismaService } from '../../prisma';
import { SuiteStatusChangedEvent, SuiteCheckedOutEvent, SuiteOutOfOrderEvent } from '../events';
export declare class SuiteEventListener {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleSuiteStatusChanged(event: SuiteStatusChangedEvent): Promise<void>;
    handleSuiteCheckedOut(event: SuiteCheckedOutEvent): Promise<void>;
    handleSuiteOutOfOrder(event: SuiteOutOfOrderEvent): Promise<void>;
}

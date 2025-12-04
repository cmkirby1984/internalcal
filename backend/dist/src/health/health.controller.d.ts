import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: HealthCheck;
        websocket: HealthCheck;
        memory: HealthCheck;
    };
}
interface HealthCheck {
    status: 'up' | 'down';
    responseTime?: number;
    details?: Record<string, unknown>;
}
export declare class HealthController {
    private readonly prisma;
    private readonly realtimeGateway;
    private startTime;
    constructor(prisma: PrismaService, realtimeGateway: RealtimeGateway);
    check(): Promise<HealthStatus>;
    liveness(): Promise<{
        status: string;
    }>;
    readiness(): Promise<{
        status: string;
        ready: boolean;
    }>;
    private checkDatabase;
    private checkWebSocket;
    private checkMemory;
}
export {};

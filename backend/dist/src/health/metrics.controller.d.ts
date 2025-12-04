import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
interface MetricsResponse {
    timestamp: string;
    application: ApplicationMetrics;
    database: DatabaseMetrics;
    websocket: WebSocketMetrics;
    system: SystemMetrics;
}
interface ApplicationMetrics {
    uptime: number;
    version: string;
    environment: string;
}
interface DatabaseMetrics {
    suiteCount: number;
    taskCount: number;
    employeeCount: number;
    noteCount: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasksToday: number;
}
interface WebSocketMetrics {
    connectedUsers: number;
    totalConnections: number;
}
interface SystemMetrics {
    memoryUsage: {
        heapUsedMB: number;
        heapTotalMB: number;
        rssMB: number;
        percentUsed: number;
    };
    cpuUsage: NodeJS.CpuUsage;
    nodeVersion: string;
    platform: string;
}
export declare class MetricsController {
    private readonly prisma;
    private readonly realtimeGateway;
    private startTime;
    constructor(prisma: PrismaService, realtimeGateway: RealtimeGateway);
    getMetrics(): Promise<MetricsResponse>;
    getPrometheusMetrics(): Promise<string>;
    private getDatabaseMetrics;
    private getWebSocketMetrics;
    private getSystemMetrics;
}
export {};

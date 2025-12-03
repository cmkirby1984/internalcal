import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
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

@Controller('metrics')
export class MetricsController {
  private startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Public()
  @Get()
  async getMetrics(): Promise<MetricsResponse> {
    const [dbMetrics, wsMetrics] = await Promise.all([
      this.getDatabaseMetrics(),
      this.getWebSocketMetrics(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      application: {
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      database: dbMetrics,
      websocket: wsMetrics,
      system: this.getSystemMetrics(),
    };
  }

  @Public()
  @Get('prometheus')
  async getPrometheusMetrics(): Promise<string> {
    const metrics = await this.getMetrics();
    
    const lines: string[] = [
      '# HELP motel_uptime_seconds Application uptime in seconds',
      '# TYPE motel_uptime_seconds gauge',
      `motel_uptime_seconds ${metrics.application.uptime}`,
      '',
      '# HELP motel_memory_heap_used_bytes Memory heap used in bytes',
      '# TYPE motel_memory_heap_used_bytes gauge',
      `motel_memory_heap_used_bytes ${metrics.system.memoryUsage.heapUsedMB * 1024 * 1024}`,
      '',
      '# HELP motel_websocket_connections Current WebSocket connections',
      '# TYPE motel_websocket_connections gauge',
      `motel_websocket_connections ${metrics.websocket.totalConnections}`,
      '',
      '# HELP motel_websocket_users Connected unique users',
      '# TYPE motel_websocket_users gauge',
      `motel_websocket_users ${metrics.websocket.connectedUsers}`,
      '',
      '# HELP motel_suites_total Total number of suites',
      '# TYPE motel_suites_total gauge',
      `motel_suites_total ${metrics.database.suiteCount}`,
      '',
      '# HELP motel_tasks_total Total number of tasks',
      '# TYPE motel_tasks_total gauge',
      `motel_tasks_total ${metrics.database.taskCount}`,
      '',
      '# HELP motel_tasks_pending Number of pending tasks',
      '# TYPE motel_tasks_pending gauge',
      `motel_tasks_pending ${metrics.database.pendingTasks}`,
      '',
      '# HELP motel_tasks_in_progress Number of in-progress tasks',
      '# TYPE motel_tasks_in_progress gauge',
      `motel_tasks_in_progress ${metrics.database.inProgressTasks}`,
      '',
      '# HELP motel_employees_total Total number of employees',
      '# TYPE motel_employees_total gauge',
      `motel_employees_total ${metrics.database.employeeCount}`,
    ];

    return lines.join('\n');
  }

  private async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      suiteCount,
      taskCount,
      employeeCount,
      noteCount,
      pendingTasks,
      inProgressTasks,
      completedTasksToday,
    ] = await Promise.all([
      this.prisma.suite.count(),
      this.prisma.task.count(),
      this.prisma.employee.count(),
      this.prisma.note.count(),
      this.prisma.task.count({ where: { status: 'PENDING' } }),
      this.prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.task.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: today },
        },
      }),
    ]);

    return {
      suiteCount,
      taskCount,
      employeeCount,
      noteCount,
      pendingTasks,
      inProgressTasks,
      completedTasksToday,
    };
  }

  private getWebSocketMetrics(): WebSocketMetrics {
    return {
      connectedUsers: this.realtimeGateway.getConnectedUsersCount(),
      totalConnections: this.realtimeGateway.getConnectionsCount(),
    };
  }

  private getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();

    return {
      memoryUsage: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}


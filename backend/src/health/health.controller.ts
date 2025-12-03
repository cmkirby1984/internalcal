import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
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

@Controller('health')
export class HealthController {
  private startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Public()
  @Get()
  async check(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkWebSocket(),
      this.checkMemory(),
    ]);

    const [database, websocket, memory] = checks;

    const allUp = database.status === 'up' && websocket.status === 'up' && memory.status === 'up';
    const anyDown = database.status === 'down' || websocket.status === 'down';

    return {
      status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: {
        database,
        websocket,
        memory,
      },
    };
  }

  @Public()
  @Get('live')
  async liveness(): Promise<{ status: string }> {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async readiness(): Promise<{ status: string; ready: boolean }> {
    const dbCheck = await this.checkDatabase();
    return {
      status: dbCheck.status === 'up' ? 'ok' : 'not ready',
      ready: dbCheck.status === 'up',
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        details: { error: (error as Error).message },
      };
    }
  }

  private checkWebSocket(): HealthCheck {
    try {
      return {
        status: 'up',
        details: {
          connectedUsers: this.realtimeGateway.getConnectedUsersCount(),
          totalConnections: this.realtimeGateway.getConnectionsCount(),
        },
      };
    } catch (error) {
      return {
        status: 'down',
        details: { error: (error as Error).message },
      };
    }
  }

  private checkMemory(): HealthCheck {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    return {
      status: usagePercent > 90 ? 'down' : 'up',
      details: {
        heapUsedMB,
        heapTotalMB,
        usagePercent,
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
    };
  }
}


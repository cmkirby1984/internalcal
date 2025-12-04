import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  error?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = (request as any).user?.sub;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: statusCode >= 400 ? 'warn' : 'info',
            context: 'HTTP',
            method,
            path: originalUrl,
            statusCode,
            duration,
            userId,
            userAgent,
            ip,
          };

          this.logger.log(JSON.stringify(logEntry));
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: 'error',
            context: 'HTTP',
            method,
            path: originalUrl,
            statusCode,
            duration,
            userId,
            userAgent,
            ip,
            error: error.message,
          };

          this.logger.error(JSON.stringify(logEntry));
        },
      }),
    );
  }
}

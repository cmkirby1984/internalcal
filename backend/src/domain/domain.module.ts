import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Status services
import { SuiteStatusService, TaskStatusService } from './status';

// Event listeners
import {
  TaskEventListener,
  SuiteEventListener,
  EmployeeEventListener,
  NoteEventListener,
} from './listeners';

// Queue processors
import { NotificationProcessor, NotificationQueueService } from './queue';

// RBAC
import { RbacGuard, RolesGuard } from './rbac';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcards for event matching
      wildcard: false,
      // Delimiter for namespaced events
      delimiter: '.',
      // Set this to true if you want to emit the newListener event
      newListener: false,
      // Set this to true if you want to emit the removeListener event
      removeListener: false,
      // Maximum number of listeners per event
      maxListeners: 10,
      // Show event name in memory leak warning
      verboseMemoryLeak: true,
      // Disable throwing uncaughtException if an error event is emitted
      ignoreErrors: false,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [
    // Status services
    SuiteStatusService,
    TaskStatusService,

    // Event listeners
    TaskEventListener,
    SuiteEventListener,
    EmployeeEventListener,
    NoteEventListener,

    // Queue processors
    NotificationProcessor,
    NotificationQueueService,

    // Guards
    RbacGuard,
    RolesGuard,
  ],
  exports: [
    // Export services for use in other modules
    SuiteStatusService,
    TaskStatusService,
    NotificationQueueService,
    RbacGuard,
    RolesGuard,
  ],
})
export class DomainModule {}


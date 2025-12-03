import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { PrismaModule } from './prisma';
import { DomainModule } from './domain';
import { AuthModule, JwtAuthGuard } from './auth';
import { SuitesModule } from './suites';
import { TasksModule } from './tasks';
import { EmployeesModule } from './employees';
import { NotesModule } from './notes';
import { NotificationsModule } from './notifications';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    DomainModule,
    AuthModule,
    SuitesModule,
    TasksModule,
    EmployeesModule,
    NotesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
    // Uncomment to enable global JWT auth (all routes protected by default)
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}

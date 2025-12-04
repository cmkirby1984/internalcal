import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma';
import {
  EmployeeClockInEvent,
  EmployeeClockOutEvent,
  DomainEventNames,
} from '../events';

@Injectable()
export class EmployeeEventListener {
  private readonly logger = new Logger(EmployeeEventListener.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * When employee clocks in, log and potentially assign pending tasks
   */
  @OnEvent(DomainEventNames.EMPLOYEE_CLOCK_IN)
  async handleEmployeeClockIn(event: EmployeeClockInEvent) {
    this.logger.log(`Employee clocked in: ${event.employeeName}`);

    // Could implement auto-assignment of pending tasks here
    // For now, just log the event
  }

  /**
   * When employee clocks out, handle any active tasks
   */
  @OnEvent(DomainEventNames.EMPLOYEE_CLOCK_OUT)
  async handleEmployeeClockOut(event: EmployeeClockOutEvent) {
    this.logger.log(`Employee clocked out: ${event.employeeName}`);

    if (event.activeTaskIds && event.activeTaskIds.length > 0) {
      this.logger.warn(
        `Employee ${event.employeeName} clocked out with ${event.activeTaskIds.length} active tasks`,
      );

      // Pause any in-progress tasks
      await this.prisma.task.updateMany({
        where: {
          id: { in: event.activeTaskIds },
          status: 'IN_PROGRESS',
        },
        data: {
          status: 'PAUSED',
        },
      });

      // Notify supervisors about paused tasks
      const supervisors = await this.prisma.employee.findMany({
        where: {
          role: { in: ['SUPERVISOR', 'MANAGER'] },
          isOnDuty: true,
        },
        select: { id: true },
      });

      if (supervisors.length > 0) {
        await this.prisma.notification.createMany({
          data: supervisors.map((s) => ({
            recipientId: s.id,
            type: 'SYSTEM_ALERT' as const,
            title: 'Tasks Paused - Employee Clocked Out',
            message: `${event.employeeName} clocked out with ${event.activeTaskIds!.length} active task(s)`,
            priority: 'HIGH' as const,
          })),
        });
      }
    }
  }
}

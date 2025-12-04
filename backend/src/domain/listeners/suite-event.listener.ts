import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma';
import {
  SuiteStatusChangedEvent,
  SuiteCheckedOutEvent,
  SuiteOutOfOrderEvent,
  DomainEventNames,
} from '../events';

@Injectable()
export class SuiteEventListener {
  private readonly logger = new Logger(SuiteEventListener.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * When suite status changes, log and potentially create tasks
   */
  @OnEvent(DomainEventNames.SUITE_STATUS_CHANGED)
  async handleSuiteStatusChanged(event: SuiteStatusChangedEvent) {
    this.logger.log(
      `Suite ${event.suiteNumber} status: ${event.previousStatus} -> ${event.newStatus}`,
    );

    // When suite becomes dirty, auto-create cleaning task
    if (event.newStatus === 'VACANT_DIRTY') {
      const existingTask = await this.prisma.task.findFirst({
        where: {
          suiteId: event.suiteId,
          type: 'CLEANING',
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
        },
      });

      if (!existingTask) {
        await this.prisma.task.create({
          data: {
            type: 'CLEANING',
            priority: 'NORMAL',
            status: 'PENDING',
            title: `Clean Suite ${event.suiteNumber}`,
            description: 'Standard cleaning after checkout',
            suiteId: event.suiteId,
            estimatedDuration: 45,
          },
        });

        this.logger.log(
          `Auto-created cleaning task for Suite ${event.suiteNumber}`,
        );
      }
    }
  }

  /**
   * When guest checks out, mark suite as dirty
   */
  @OnEvent(DomainEventNames.SUITE_CHECKED_OUT)
  async handleSuiteCheckedOut(event: SuiteCheckedOutEvent) {
    this.logger.log(`Suite ${event.suiteNumber} checked out`);

    // Update suite status to vacant dirty
    await this.prisma.suite.update({
      where: { id: event.suiteId },
      data: {
        status: 'VACANT_DIRTY',
        currentGuest: undefined,
      },
    });

    // Create cleaning task
    await this.prisma.task.create({
      data: {
        type: 'CLEANING',
        priority: 'HIGH', // Higher priority for checkout cleaning
        status: 'PENDING',
        title: `Checkout Clean - Suite ${event.suiteNumber}`,
        description: 'Full checkout cleaning required',
        suiteId: event.suiteId,
        estimatedDuration: 60,
      },
    });
  }

  /**
   * When suite goes out of order, notify maintenance team
   */
  @OnEvent(DomainEventNames.SUITE_OUT_OF_ORDER)
  async handleSuiteOutOfOrder(event: SuiteOutOfOrderEvent) {
    this.logger.warn(
      `Suite ${event.suiteNumber} marked OUT OF ORDER: ${event.reason || 'No reason provided'}`,
    );

    // Find all maintenance staff
    const maintenanceStaff = await this.prisma.employee.findMany({
      where: {
        role: { in: ['MAINTENANCE', 'SUPERVISOR', 'MANAGER'] },
        department: 'MAINTENANCE',
        status: { not: 'INACTIVE' },
      },
      select: { id: true },
    });

    // Notify maintenance team
    if (maintenanceStaff.length > 0) {
      await this.prisma.notification.createMany({
        data: maintenanceStaff.map((m) => ({
          recipientId: m.id,
          type: 'SUITE_STATUS_CHANGE' as const,
          title: 'Suite Out of Order',
          message: `Suite ${event.suiteNumber} requires maintenance${event.reason ? `: ${event.reason}` : ''}`,
          priority: 'HIGH' as const,
          relatedEntityType: 'Suite',
          relatedEntityId: event.suiteId,
          actionUrl: `/suites/${event.suiteId}`,
        })),
      });
    }
  }
}

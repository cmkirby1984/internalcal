import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma';
import { SuiteStatusService } from '../status';
import {
  TaskCompletedEvent,
  TaskAssignedEvent,
  EmergencyTaskCreatedEvent,
  DomainEventNames,
} from '../events';

@Injectable()
export class TaskEventListener {
  private readonly logger = new Logger(TaskEventListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly suiteStatusService: SuiteStatusService,
  ) {}

  /**
   * When a task is completed, update suite status if applicable
   */
  @OnEvent(DomainEventNames.TASK_COMPLETED)
  async handleTaskCompleted(event: TaskCompletedEvent) {
    this.logger.log(
      `Task completed: ${event.title} (${event.taskId}) - Type: ${event.type}`,
    );

    if (!event.suiteId) {
      return;
    }

    const suite = await this.prisma.suite.findUnique({
      where: { id: event.suiteId },
    });

    if (!suite) {
      return;
    }

    // Determine new status based on task type
    const newStatus = this.suiteStatusService.getStatusAfterTaskCompletion(
      suite.status,
      event.type as 'CLEANING' | 'MAINTENANCE',
    );

    if (newStatus && newStatus !== suite.status) {
      await this.prisma.suite.update({
        where: { id: event.suiteId },
        data: {
          status: newStatus,
          ...(event.type === 'CLEANING' && { lastCleaned: new Date() }),
        },
      });

      this.logger.log(
        `Suite ${suite.suiteNumber} status updated: ${suite.status} -> ${newStatus}`,
      );
    }

    // Update employee task completion stats
    if (event.completedById) {
      await this.prisma.employee.update({
        where: { id: event.completedById },
        data: {
          tasksCompleted: { increment: 1 },
          lastActive: new Date(),
        },
      });
    }
  }

  /**
   * When a task is assigned, create notification for assignee
   */
  @OnEvent(DomainEventNames.TASK_ASSIGNED)
  async handleTaskAssigned(event: TaskAssignedEvent) {
    this.logger.log(`Task assigned: ${event.title} to ${event.assignedToName}`);

    // Create notification for the assignee
    await this.prisma.notification.create({
      data: {
        recipientId: event.assignedToId,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: event.title,
        priority: 'NORMAL',
        relatedEntityType: 'Task',
        relatedEntityId: event.taskId,
        actionUrl: `/tasks/${event.taskId}`,
      },
    });
  }

  /**
   * When an emergency task is created, notify all supervisors and managers
   */
  @OnEvent(DomainEventNames.TASK_EMERGENCY_CREATED)
  async handleEmergencyTask(event: EmergencyTaskCreatedEvent) {
    this.logger.warn(
      `EMERGENCY TASK: ${event.title} - Suite: ${event.suiteNumber || 'N/A'}`,
    );

    // Find all supervisors and managers
    const supervisors = await this.prisma.employee.findMany({
      where: {
        role: { in: ['SUPERVISOR', 'MANAGER', 'ADMIN'] },
        status: { not: 'INACTIVE' },
      },
      select: { id: true },
    });

    // Create notifications for all supervisors
    if (supervisors.length > 0) {
      await this.prisma.notification.createMany({
        data: supervisors.map((s) => ({
          recipientId: s.id,
          type: 'EMERGENCY_TASK' as const,
          title: '🚨 EMERGENCY TASK',
          message: `${event.title}${event.suiteNumber ? ` - Suite ${event.suiteNumber}` : ''}`,
          priority: 'URGENT' as const,
          relatedEntityType: 'Task',
          relatedEntityId: event.taskId,
          actionUrl: `/tasks/${event.taskId}`,
          actionRequired: true,
        })),
      });

      this.logger.log(
        `Emergency notifications sent to ${supervisors.length} supervisors`,
      );
    }
  }
}

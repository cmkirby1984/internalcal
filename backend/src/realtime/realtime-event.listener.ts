import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeGateway } from './realtime.gateway';
import {
  TaskCreatedEvent,
  TaskAssignedEvent,
  TaskCompletedEvent,
  TaskStatusChangedEvent,
  EmergencyTaskCreatedEvent,
  SuiteStatusChangedEvent,
  DomainEventNames,
} from '../domain/events';

/**
 * Listens to domain events and broadcasts them via WebSocket
 */
@Injectable()
export class RealtimeEventListener {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  @OnEvent(DomainEventNames.TASK_CREATED)
  handleTaskCreated(event: TaskCreatedEvent) {
    this.realtimeGateway.emitTaskCreated(
      {
        id: event.taskId,
        title: event.title,
        type: event.type,
        priority: event.priority,
        suiteId: event.suiteId,
        suiteNumber: event.suiteNumber,
        assignedToId: event.assignedToId,
      },
      event.createdById || 'system',
    );
  }

  @OnEvent(DomainEventNames.TASK_ASSIGNED)
  handleTaskAssigned(event: TaskAssignedEvent) {
    this.realtimeGateway.emitTaskAssigned(
      event.taskId,
      event.title,
      event.assignedToId,
      event.assignedById || 'system',
    );
  }

  @OnEvent(DomainEventNames.TASK_COMPLETED)
  handleTaskCompleted(event: TaskCompletedEvent) {
    this.realtimeGateway.emitTaskCompleted(
      event.taskId,
      event.title,
      event.suiteId,
      event.completedById || 'system',
    );
  }

  @OnEvent(DomainEventNames.TASK_STATUS_CHANGED)
  handleTaskStatusChanged(event: TaskStatusChangedEvent) {
    this.realtimeGateway.emitTaskUpdated(
      event.taskId,
      {
        status: event.newStatus,
        previousStatus: event.previousStatus,
      },
      event.changedById || 'system',
    );
  }

  @OnEvent(DomainEventNames.TASK_EMERGENCY_CREATED)
  handleEmergencyTask(event: EmergencyTaskCreatedEvent) {
    this.realtimeGateway.emitEmergencyTask(
      {
        id: event.taskId,
        title: event.title,
        suiteId: event.suiteId,
        suiteNumber: event.suiteNumber,
        description: event.description,
      },
      event.createdById || 'system',
    );
  }

  @OnEvent(DomainEventNames.SUITE_STATUS_CHANGED)
  handleSuiteStatusChanged(event: SuiteStatusChangedEvent) {
    this.realtimeGateway.emitSuiteUpdated(
      event.suiteId,
      {
        status: event.newStatus,
        previousStatus: event.previousStatus,
      },
      event.changedBy || 'system',
    );
  }
}

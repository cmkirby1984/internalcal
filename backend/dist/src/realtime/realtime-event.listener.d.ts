import { RealtimeGateway } from './realtime.gateway';
import { TaskCreatedEvent, TaskAssignedEvent, TaskCompletedEvent, TaskStatusChangedEvent, EmergencyTaskCreatedEvent, SuiteStatusChangedEvent } from '../domain/events';
export declare class RealtimeEventListener {
    private readonly realtimeGateway;
    constructor(realtimeGateway: RealtimeGateway);
    handleTaskCreated(event: TaskCreatedEvent): void;
    handleTaskAssigned(event: TaskAssignedEvent): void;
    handleTaskCompleted(event: TaskCompletedEvent): void;
    handleTaskStatusChanged(event: TaskStatusChangedEvent): void;
    handleEmergencyTask(event: EmergencyTaskCreatedEvent): void;
    handleSuiteStatusChanged(event: SuiteStatusChangedEvent): void;
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const realtime_gateway_1 = require("./realtime.gateway");
const events_1 = require("../domain/events");
let RealtimeEventListener = class RealtimeEventListener {
    realtimeGateway;
    constructor(realtimeGateway) {
        this.realtimeGateway = realtimeGateway;
    }
    handleTaskCreated(event) {
        this.realtimeGateway.emitTaskCreated({
            id: event.taskId,
            title: event.title,
            type: event.type,
            priority: event.priority,
            suiteId: event.suiteId,
            suiteNumber: event.suiteNumber,
            assignedToId: event.assignedToId,
        }, event.createdById || 'system');
    }
    handleTaskAssigned(event) {
        this.realtimeGateway.emitTaskAssigned(event.taskId, event.title, event.assignedToId, event.assignedById || 'system');
    }
    handleTaskCompleted(event) {
        this.realtimeGateway.emitTaskCompleted(event.taskId, event.title, event.suiteId, event.completedById || 'system');
    }
    handleTaskStatusChanged(event) {
        this.realtimeGateway.emitTaskUpdated(event.taskId, {
            status: event.newStatus,
            previousStatus: event.previousStatus,
        }, event.changedById || 'system');
    }
    handleEmergencyTask(event) {
        this.realtimeGateway.emitEmergencyTask({
            id: event.taskId,
            title: event.title,
            suiteId: event.suiteId,
            suiteNumber: event.suiteNumber,
            description: event.description,
        }, event.createdById || 'system');
    }
    handleSuiteStatusChanged(event) {
        this.realtimeGateway.emitSuiteUpdated(event.suiteId, {
            status: event.newStatus,
            previousStatus: event.previousStatus,
        }, event.changedBy || 'system');
    }
};
exports.RealtimeEventListener = RealtimeEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.TASK_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.TaskCreatedEvent]),
    __metadata("design:returntype", void 0)
], RealtimeEventListener.prototype, "handleTaskCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.TASK_ASSIGNED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.TaskAssignedEvent]),
    __metadata("design:returntype", void 0)
], RealtimeEventListener.prototype, "handleTaskAssigned", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.TASK_COMPLETED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.TaskCompletedEvent]),
    __metadata("design:returntype", void 0)
], RealtimeEventListener.prototype, "handleTaskCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.TASK_STATUS_CHANGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.TaskStatusChangedEvent]),
    __metadata("design:returntype", void 0)
], RealtimeEventListener.prototype, "handleTaskStatusChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.TASK_EMERGENCY_CREATED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.EmergencyTaskCreatedEvent]),
    __metadata("design:returntype", void 0)
], RealtimeEventListener.prototype, "handleEmergencyTask", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.SUITE_STATUS_CHANGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.SuiteStatusChangedEvent]),
    __metadata("design:returntype", void 0)
], RealtimeEventListener.prototype, "handleSuiteStatusChanged", null);
exports.RealtimeEventListener = RealtimeEventListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_gateway_1.RealtimeGateway])
], RealtimeEventListener);
//# sourceMappingURL=realtime-event.listener.js.map
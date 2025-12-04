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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    jwtService;
    configService;
    server;
    logger = new common_1.Logger(RealtimeGateway_1.name);
    userConnections = new Map();
    socketToUser = new Map();
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                this.logger.warn(`Client ${client.id} connection rejected: No token`);
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            client.userId = payload.sub;
            client.userRole = payload.role;
            client.userDepartment = payload.department;
            if (!this.userConnections.has(payload.sub)) {
                this.userConnections.set(payload.sub, new Set());
            }
            this.userConnections.get(payload.sub).add(client.id);
            this.socketToUser.set(client.id, payload.sub);
            client.join('all_staff');
            if (payload.department) {
                client.join(`department:${payload.department}`);
            }
            if (payload.role) {
                client.join(`role:${payload.role}`);
            }
            this.logger.log(`Client connected: ${client.id} (User: ${payload.sub}, Role: ${payload.role})`);
            client.emit('connected', {
                userId: payload.sub,
                timestamp: new Date().toISOString(),
                rooms: Array.from(client.rooms),
            });
        }
        catch (error) {
            this.logger.warn(`Client ${client.id} connection rejected: Invalid token - ${error.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = this.socketToUser.get(client.id);
        if (userId) {
            const userSockets = this.userConnections.get(userId);
            if (userSockets) {
                userSockets.delete(client.id);
                if (userSockets.size === 0) {
                    this.userConnections.delete(userId);
                }
            }
            this.socketToUser.delete(client.id);
        }
        this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    }
    handleHeartbeat(client, data) {
        return {
            event: 'heartbeat_ack',
            data: {
                timestamp: Date.now(),
                clientTimestamp: data.timestamp,
            },
        };
    }
    handleSubscribeSuite(client, data) {
        client.join(`suite:${data.suiteId}`);
        this.logger.debug(`Client ${client.id} subscribed to suite:${data.suiteId}`);
        return { event: 'subscribed', data: { room: `suite:${data.suiteId}` } };
    }
    handleUnsubscribeSuite(client, data) {
        client.leave(`suite:${data.suiteId}`);
        this.logger.debug(`Client ${client.id} unsubscribed from suite:${data.suiteId}`);
        return { event: 'unsubscribed', data: { room: `suite:${data.suiteId}` } };
    }
    handleSubscribeTask(client, data) {
        client.join(`task:${data.taskId}`);
        return { event: 'subscribed', data: { room: `task:${data.taskId}` } };
    }
    handleUnsubscribeTask(client, data) {
        client.leave(`task:${data.taskId}`);
        return { event: 'unsubscribed', data: { room: `task:${data.taskId}` } };
    }
    broadcastToAll(event, payload) {
        this.server.to('all_staff').emit(event, payload);
        this.logger.debug(`Broadcast to all_staff: ${event}`);
    }
    broadcastToDepartment(department, event, payload) {
        this.server.to(`department:${department}`).emit(event, payload);
        this.logger.debug(`Broadcast to department:${department}: ${event}`);
    }
    broadcastToRole(role, event, payload) {
        this.server.to(`role:${role}`).emit(event, payload);
        this.logger.debug(`Broadcast to role:${role}: ${event}`);
    }
    broadcastToSuite(suiteId, event, payload) {
        this.server.to(`suite:${suiteId}`).emit(event, payload);
        this.logger.debug(`Broadcast to suite:${suiteId}: ${event}`);
    }
    broadcastToTask(taskId, event, payload) {
        this.server.to(`task:${taskId}`).emit(event, payload);
        this.logger.debug(`Broadcast to task:${taskId}: ${event}`);
    }
    sendToUser(userId, event, payload) {
        const userSockets = this.userConnections.get(userId);
        if (userSockets) {
            userSockets.forEach((socketId) => {
                this.server.to(socketId).emit(event, payload);
            });
            this.logger.debug(`Sent to user ${userId}: ${event}`);
        }
    }
    broadcastExceptUser(userId, event, payload, room = 'all_staff') {
        const userSockets = this.userConnections.get(userId);
        if (userSockets) {
            const socketsInRoom = this.server.sockets.adapter.rooms.get(room);
            if (socketsInRoom) {
                socketsInRoom.forEach((socketId) => {
                    if (!userSockets.has(socketId)) {
                        this.server.to(socketId).emit(event, payload);
                    }
                });
            }
        }
        else {
            this.server.to(room).emit(event, payload);
        }
    }
    emitSuiteCreated(suite, createdBy) {
        const payload = {
            type: 'ENTITY_CREATED',
            entityType: 'SUITE',
            data: { suite },
            updatedBy: createdBy,
            timestamp: new Date().toISOString(),
        };
        this.broadcastToAll('suite_created', payload);
    }
    emitSuiteUpdated(suiteId, changes, updatedBy) {
        const payload = {
            type: 'ENTITY_UPDATED',
            entityType: 'SUITE',
            data: { suiteId, changes },
            updatedBy,
            timestamp: new Date().toISOString(),
        };
        this.broadcastExceptUser(updatedBy, 'suite_updated', payload);
        this.broadcastToSuite(suiteId, 'suite_updated', payload);
    }
    emitTaskCreated(task, createdBy) {
        const payload = {
            type: 'ENTITY_CREATED',
            entityType: 'TASK',
            data: { task },
            updatedBy: createdBy,
            timestamp: new Date().toISOString(),
        };
        this.broadcastToAll('task_created', payload);
    }
    emitTaskUpdated(taskId, changes, updatedBy) {
        const payload = {
            type: 'ENTITY_UPDATED',
            entityType: 'TASK',
            data: { taskId, changes },
            updatedBy,
            timestamp: new Date().toISOString(),
        };
        this.broadcastExceptUser(updatedBy, 'task_updated', payload);
        this.broadcastToTask(taskId, 'task_updated', payload);
    }
    emitTaskAssigned(taskId, taskTitle, assignedToId, assignedById) {
        this.sendToUser(assignedToId, 'task_assigned', {
            type: 'TASK_ASSIGNED',
            data: {
                taskId,
                taskTitle,
                assignedById,
                timestamp: new Date().toISOString(),
            },
        });
        const payload = {
            type: 'TASK_ASSIGNED',
            entityType: 'TASK',
            data: { taskId, taskTitle, assignedToId, assignedById },
            updatedBy: assignedById,
            timestamp: new Date().toISOString(),
        };
        this.broadcastToAll('task_assigned_broadcast', payload);
    }
    emitTaskCompleted(taskId, taskTitle, suiteId, completedBy) {
        const payload = {
            type: 'TASK_COMPLETED',
            entityType: 'TASK',
            data: { taskId, taskTitle, suiteId },
            updatedBy: completedBy,
            timestamp: new Date().toISOString(),
        };
        this.broadcastToAll('task_completed', payload);
        if (suiteId) {
            this.broadcastToSuite(suiteId, 'task_completed', payload);
        }
    }
    emitEmergencyTask(task, createdBy) {
        const payload = {
            type: 'EMERGENCY_TASK',
            entityType: 'TASK',
            data: { task },
            updatedBy: createdBy,
            timestamp: new Date().toISOString(),
        };
        this.broadcastToRole('SUPERVISOR', 'emergency_task', payload);
        this.broadcastToRole('MANAGER', 'emergency_task', payload);
        this.broadcastToRole('ADMIN', 'emergency_task', payload);
    }
    emitNoteCreated(note, createdBy) {
        const payload = {
            type: 'ENTITY_CREATED',
            entityType: 'NOTE',
            data: { note },
            updatedBy: createdBy,
            timestamp: new Date().toISOString(),
        };
        this.broadcastToAll('note_created', payload);
    }
    emitEmployeeStatusChanged(employeeId, changes) {
        const payload = {
            type: 'ENTITY_UPDATED',
            entityType: 'EMPLOYEE',
            data: { employeeId, changes },
            timestamp: new Date().toISOString(),
        };
        this.broadcastToAll('employee_status_changed', payload);
    }
    getConnectedUsersCount() {
        return this.userConnections.size;
    }
    getConnectionsCount() {
        return this.socketToUser.size;
    }
    isUserConnected(userId) {
        return this.userConnections.has(userId);
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('heartbeat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleHeartbeat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_suite'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribeSuite", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe_suite'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleUnsubscribeSuite", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_task'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribeTask", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe_task'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleUnsubscribeTask", null);
exports.RealtimeGateway = RealtimeGateway = RealtimeGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
        namespace: '/realtime',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map
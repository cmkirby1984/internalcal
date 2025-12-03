import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userDepartment?: string;
}

interface BroadcastPayload {
  type: string;
  entityType: string;
  data: Record<string, unknown>;
  updatedBy?: string;
  timestamp: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // Configure properly in production
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  // Track connected clients by userId (supports multiple connections per user)
  private userConnections = new Map<string, Set<string>>(); // userId -> Set<socketId>
  private socketToUser = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user info to socket
      client.userId = payload.sub;
      client.userRole = payload.role;
      client.userDepartment = payload.department;

      // Track connection
      if (!this.userConnections.has(payload.sub)) {
        this.userConnections.set(payload.sub, new Set());
      }
      this.userConnections.get(payload.sub)!.add(client.id);
      this.socketToUser.set(client.id, payload.sub);

      // Join default rooms
      client.join('all_staff');
      if (payload.department) {
        client.join(`department:${payload.department}`);
      }
      if (payload.role) {
        client.join(`role:${payload.role}`);
      }

      this.logger.log(
        `Client connected: ${client.id} (User: ${payload.sub}, Role: ${payload.role})`,
      );

      // Send connection acknowledgment
      client.emit('connected', {
        userId: payload.sub,
        timestamp: new Date().toISOString(),
        rooms: Array.from(client.rooms),
      });
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} connection rejected: Invalid token - ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
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

  // ─────────────────────────────────────────────────────────────────────────────
  // CLIENT MESSAGE HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  @SubscribeMessage('heartbeat')
  handleHeartbeat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { timestamp: number },
  ) {
    return {
      event: 'heartbeat_ack',
      data: {
        timestamp: Date.now(),
        clientTimestamp: data.timestamp,
      },
    };
  }

  @SubscribeMessage('subscribe_suite')
  handleSubscribeSuite(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { suiteId: string },
  ) {
    client.join(`suite:${data.suiteId}`);
    this.logger.debug(`Client ${client.id} subscribed to suite:${data.suiteId}`);
    return { event: 'subscribed', data: { room: `suite:${data.suiteId}` } };
  }

  @SubscribeMessage('unsubscribe_suite')
  handleUnsubscribeSuite(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { suiteId: string },
  ) {
    client.leave(`suite:${data.suiteId}`);
    this.logger.debug(`Client ${client.id} unsubscribed from suite:${data.suiteId}`);
    return { event: 'unsubscribed', data: { room: `suite:${data.suiteId}` } };
  }

  @SubscribeMessage('subscribe_task')
  handleSubscribeTask(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string },
  ) {
    client.join(`task:${data.taskId}`);
    return { event: 'subscribed', data: { room: `task:${data.taskId}` } };
  }

  @SubscribeMessage('unsubscribe_task')
  handleUnsubscribeTask(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: string },
  ) {
    client.leave(`task:${data.taskId}`);
    return { event: 'unsubscribed', data: { room: `task:${data.taskId}` } };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // BROADCAST METHODS (Called from services/listeners)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(event: string, payload: BroadcastPayload) {
    this.server.to('all_staff').emit(event, payload);
    this.logger.debug(`Broadcast to all_staff: ${event}`);
  }

  /**
   * Broadcast to a specific department
   */
  broadcastToDepartment(department: string, event: string, payload: BroadcastPayload) {
    this.server.to(`department:${department}`).emit(event, payload);
    this.logger.debug(`Broadcast to department:${department}: ${event}`);
  }

  /**
   * Broadcast to a specific role
   */
  broadcastToRole(role: string, event: string, payload: BroadcastPayload) {
    this.server.to(`role:${role}`).emit(event, payload);
    this.logger.debug(`Broadcast to role:${role}: ${event}`);
  }

  /**
   * Broadcast to clients subscribed to a specific suite
   */
  broadcastToSuite(suiteId: string, event: string, payload: BroadcastPayload) {
    this.server.to(`suite:${suiteId}`).emit(event, payload);
    this.logger.debug(`Broadcast to suite:${suiteId}: ${event}`);
  }

  /**
   * Broadcast to clients subscribed to a specific task
   */
  broadcastToTask(taskId: string, event: string, payload: BroadcastPayload) {
    this.server.to(`task:${taskId}`).emit(event, payload);
    this.logger.debug(`Broadcast to task:${taskId}: ${event}`);
  }

  /**
   * Send to a specific user (all their connections)
   */
  sendToUser(userId: string, event: string, payload: unknown) {
    const userSockets = this.userConnections.get(userId);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, payload);
      });
      this.logger.debug(`Sent to user ${userId}: ${event}`);
    }
  }

  /**
   * Broadcast to all except a specific user
   */
  broadcastExceptUser(
    userId: string,
    event: string,
    payload: BroadcastPayload,
    room = 'all_staff',
  ) {
    const userSockets = this.userConnections.get(userId);
    if (userSockets) {
      // Get all sockets in the room except the user's sockets
      const socketsInRoom = this.server.sockets.adapter.rooms.get(room);
      if (socketsInRoom) {
        socketsInRoom.forEach((socketId) => {
          if (!userSockets.has(socketId)) {
            this.server.to(socketId).emit(event, payload);
          }
        });
      }
    } else {
      // User not connected, broadcast to all in room
      this.server.to(room).emit(event, payload);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ENTITY EVENT METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  emitSuiteCreated(suite: Record<string, unknown>, createdBy: string) {
    const payload: BroadcastPayload = {
      type: 'ENTITY_CREATED',
      entityType: 'SUITE',
      data: { suite },
      updatedBy: createdBy,
      timestamp: new Date().toISOString(),
    };
    this.broadcastToAll('suite_created', payload);
  }

  emitSuiteUpdated(
    suiteId: string,
    changes: Record<string, unknown>,
    updatedBy: string,
  ) {
    const payload: BroadcastPayload = {
      type: 'ENTITY_UPDATED',
      entityType: 'SUITE',
      data: { suiteId, changes },
      updatedBy,
      timestamp: new Date().toISOString(),
    };
    this.broadcastExceptUser(updatedBy, 'suite_updated', payload);
    this.broadcastToSuite(suiteId, 'suite_updated', payload);
  }

  emitTaskCreated(task: Record<string, unknown>, createdBy: string) {
    const payload: BroadcastPayload = {
      type: 'ENTITY_CREATED',
      entityType: 'TASK',
      data: { task },
      updatedBy: createdBy,
      timestamp: new Date().toISOString(),
    };
    this.broadcastToAll('task_created', payload);
  }

  emitTaskUpdated(
    taskId: string,
    changes: Record<string, unknown>,
    updatedBy: string,
  ) {
    const payload: BroadcastPayload = {
      type: 'ENTITY_UPDATED',
      entityType: 'TASK',
      data: { taskId, changes },
      updatedBy,
      timestamp: new Date().toISOString(),
    };
    this.broadcastExceptUser(updatedBy, 'task_updated', payload);
    this.broadcastToTask(taskId, 'task_updated', payload);
  }

  emitTaskAssigned(
    taskId: string,
    taskTitle: string,
    assignedToId: string,
    assignedById: string,
  ) {
    // Notify the assigned user directly
    this.sendToUser(assignedToId, 'task_assigned', {
      type: 'TASK_ASSIGNED',
      data: {
        taskId,
        taskTitle,
        assignedById,
        timestamp: new Date().toISOString(),
      },
    });

    // Broadcast to all staff
    const payload: BroadcastPayload = {
      type: 'TASK_ASSIGNED',
      entityType: 'TASK',
      data: { taskId, taskTitle, assignedToId, assignedById },
      updatedBy: assignedById,
      timestamp: new Date().toISOString(),
    };
    this.broadcastToAll('task_assigned_broadcast', payload);
  }

  emitTaskCompleted(
    taskId: string,
    taskTitle: string,
    suiteId: string | undefined,
    completedBy: string,
  ) {
    const payload: BroadcastPayload = {
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

  emitEmergencyTask(task: Record<string, unknown>, createdBy: string) {
    const payload: BroadcastPayload = {
      type: 'EMERGENCY_TASK',
      entityType: 'TASK',
      data: { task },
      updatedBy: createdBy,
      timestamp: new Date().toISOString(),
    };

    // Send to supervisors and managers
    this.broadcastToRole('SUPERVISOR', 'emergency_task', payload);
    this.broadcastToRole('MANAGER', 'emergency_task', payload);
    this.broadcastToRole('ADMIN', 'emergency_task', payload);
  }

  emitNoteCreated(note: Record<string, unknown>, createdBy: string) {
    const payload: BroadcastPayload = {
      type: 'ENTITY_CREATED',
      entityType: 'NOTE',
      data: { note },
      updatedBy: createdBy,
      timestamp: new Date().toISOString(),
    };
    this.broadcastToAll('note_created', payload);
  }

  emitEmployeeStatusChanged(
    employeeId: string,
    changes: Record<string, unknown>,
  ) {
    const payload: BroadcastPayload = {
      type: 'ENTITY_UPDATED',
      entityType: 'EMPLOYEE',
      data: { employeeId, changes },
      timestamp: new Date().toISOString(),
    };
    this.broadcastToAll('employee_status_changed', payload);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  getConnectionsCount(): number {
    return this.socketToUser.size;
  }

  isUserConnected(userId: string): boolean {
    return this.userConnections.has(userId);
  }
}


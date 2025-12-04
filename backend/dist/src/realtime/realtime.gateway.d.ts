import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
export declare class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    server: Server;
    private readonly logger;
    private userConnections;
    private socketToUser;
    constructor(jwtService: JwtService, configService: ConfigService);
    afterInit(server: Server): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleHeartbeat(client: AuthenticatedSocket, data: {
        timestamp: number;
    }): {
        event: string;
        data: {
            timestamp: number;
            clientTimestamp: number;
        };
    };
    handleSubscribeSuite(client: AuthenticatedSocket, data: {
        suiteId: string;
    }): {
        event: string;
        data: {
            room: string;
        };
    };
    handleUnsubscribeSuite(client: AuthenticatedSocket, data: {
        suiteId: string;
    }): {
        event: string;
        data: {
            room: string;
        };
    };
    handleSubscribeTask(client: AuthenticatedSocket, data: {
        taskId: string;
    }): {
        event: string;
        data: {
            room: string;
        };
    };
    handleUnsubscribeTask(client: AuthenticatedSocket, data: {
        taskId: string;
    }): {
        event: string;
        data: {
            room: string;
        };
    };
    broadcastToAll(event: string, payload: BroadcastPayload): void;
    broadcastToDepartment(department: string, event: string, payload: BroadcastPayload): void;
    broadcastToRole(role: string, event: string, payload: BroadcastPayload): void;
    broadcastToSuite(suiteId: string, event: string, payload: BroadcastPayload): void;
    broadcastToTask(taskId: string, event: string, payload: BroadcastPayload): void;
    sendToUser(userId: string, event: string, payload: unknown): void;
    broadcastExceptUser(userId: string, event: string, payload: BroadcastPayload, room?: string): void;
    emitSuiteCreated(suite: Record<string, unknown>, createdBy: string): void;
    emitSuiteUpdated(suiteId: string, changes: Record<string, unknown>, updatedBy: string): void;
    emitTaskCreated(task: Record<string, unknown>, createdBy: string): void;
    emitTaskUpdated(taskId: string, changes: Record<string, unknown>, updatedBy: string): void;
    emitTaskAssigned(taskId: string, taskTitle: string, assignedToId: string, assignedById: string): void;
    emitTaskCompleted(taskId: string, taskTitle: string, suiteId: string | undefined, completedBy: string): void;
    emitEmergencyTask(task: Record<string, unknown>, createdBy: string): void;
    emitNoteCreated(note: Record<string, unknown>, createdBy: string): void;
    emitEmployeeStatusChanged(employeeId: string, changes: Record<string, unknown>): void;
    getConnectedUsersCount(): number;
    getConnectionsCount(): number;
    isUserConnected(userId: string): boolean;
}
export {};

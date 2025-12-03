/**
 * WebSocket Manager
 * Handles real-time connection to the backend with reconnection logic
 */

import { io, Socket } from 'socket.io-client';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export interface WebSocketMessage {
  type: string;
  entityType?: string;
  data: Record<string, unknown>;
  updatedBy?: string;
  timestamp: string;
}

type EventCallback = (data: unknown) => void;

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // ms
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export class WebSocketManager {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: { event: string; data: unknown }[] = [];
  private subscriptions = new Map<string, Set<EventCallback>>();
  private authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  connect(): void {
    if (this.connectionState === 'CONNECTED' || this.connectionState === 'CONNECTING') {
      return;
    }

    try {
      this.connectionState = 'CONNECTING';
      this.emit('connectionStateChange', this.connectionState);

      this.socket = io(`${WS_BASE_URL}/realtime`, {
        auth: {
          token: this.authToken,
        },
        transports: ['websocket', 'polling'],
        reconnection: false, // We handle reconnection manually
      });

      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected');
        this.connectionState = 'CONNECTED';
        this.reconnectAttempts = 0;
        this.emit('connectionStateChange', this.connectionState);
        this.emit('connected', null);
        this.startHeartbeat();
        this.processMessageQueue();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
        this.connectionState = 'DISCONNECTED';
        this.emit('connectionStateChange', this.connectionState);
        this.emit('disconnected', { reason });
        this.stopHeartbeat();

        // Attempt reconnection if not a clean close
        if (reason !== 'io client disconnect') {
          this.reconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error.message);
        this.emit('error', { message: error.message });
        this.reconnect();
      });

      // Set up message handlers
      this.setupMessageHandlers();
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      this.reconnect();
    }
  }

  private setupMessageHandlers(): void {
    if (!this.socket) return;

    // Connection acknowledgment
    this.socket.on('connected', (data) => {
      this.emit('connected', data);
    });

    // Heartbeat acknowledgment
    this.socket.on('heartbeat_ack', (data) => {
      // Connection is healthy
      this.emit('heartbeat_ack', data);
    });

    // Entity events
    this.socket.on('suite_created', (data) => this.emit('suite_created', data));
    this.socket.on('suite_updated', (data) => this.emit('suite_updated', data));
    this.socket.on('task_created', (data) => this.emit('task_created', data));
    this.socket.on('task_updated', (data) => this.emit('task_updated', data));
    this.socket.on('task_assigned', (data) => this.emit('task_assigned', data));
    this.socket.on('task_assigned_broadcast', (data) => this.emit('task_assigned_broadcast', data));
    this.socket.on('task_completed', (data) => this.emit('task_completed', data));
    this.socket.on('emergency_task', (data) => this.emit('emergency_task', data));
    this.socket.on('note_created', (data) => this.emit('note_created', data));
    this.socket.on('employee_status_changed', (data) => this.emit('employee_status_changed', data));
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.emit('reconnect_failed', null);
      return;
    }

    this.connectionState = 'RECONNECTING';
    this.emit('connectionStateChange', this.connectionState);
    this.reconnectAttempts++;

    // Exponential backoff
    const delay = RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WebSocket] Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState === 'CONNECTED' && this.socket) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(event: string, data: unknown): void {
    if (this.connectionState === 'CONNECTED' && this.socket) {
      this.socket.emit(event, data);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push({ event, data });
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.socket) {
        this.socket.emit(message.event, message.data);
      }
    }
  }

  // Pub/Sub pattern for event handling
  on(event: string, callback: EventCallback): void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    if (this.subscriptions.has(event)) {
      this.subscriptions.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data: unknown): void {
    if (this.subscriptions.has(event)) {
      this.subscriptions.get(event)!.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WebSocket] Error in event callback:', error);
        }
      });
    }
  }

  // Room subscriptions
  subscribeSuite(suiteId: string): void {
    this.send('subscribe_suite', { suiteId });
  }

  unsubscribeSuite(suiteId: string): void {
    this.send('unsubscribe_suite', { suiteId });
  }

  subscribeTask(taskId: string): void {
    this.send('subscribe_task', { taskId });
  }

  unsubscribeTask(taskId: string): void {
    this.send('unsubscribe_task', { taskId });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState = 'DISCONNECTED';
    this.emit('connectionStateChange', this.connectionState);
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === 'CONNECTED';
  }

  updateToken(newToken: string): void {
    this.authToken = newToken;
    if (this.socket) {
      this.socket.auth = { token: newToken };
    }
  }
}


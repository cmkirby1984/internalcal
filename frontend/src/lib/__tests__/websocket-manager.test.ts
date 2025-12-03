/**
 * WebSocket Manager Tests
 * Tests for real-time connection handling, reconnection logic, and message queuing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketManager, ConnectionState } from '../realtime/websocket-manager';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    auth: {},
  };

  return {
    io: vi.fn(() => mockSocket),
  };
});

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  const mockToken = 'test-jwt-token';

  beforeEach(() => {
    vi.clearAllMocks();
    wsManager = new WebSocketManager(mockToken);
  });

  afterEach(() => {
    wsManager.disconnect();
  });

  describe('Connection State', () => {
    it('should start in DISCONNECTED state', () => {
      expect(wsManager.getConnectionState()).toBe('DISCONNECTED');
      expect(wsManager.isConnected()).toBe(false);
    });

    it('should transition to CONNECTING when connect is called', () => {
      const stateChanges: ConnectionState[] = [];
      wsManager.on('connectionStateChange', (state) => {
        stateChanges.push(state as ConnectionState);
      });

      wsManager.connect();

      expect(stateChanges).toContain('CONNECTING');
    });

    it('should not reconnect if already connected or connecting', () => {
      wsManager.connect();
      const initialState = wsManager.getConnectionState();
      
      wsManager.connect(); // Second call should be ignored
      
      expect(wsManager.getConnectionState()).toBe(initialState);
    });
  });

  describe('Event Subscription', () => {
    it('should allow subscribing to events', () => {
      const callback = vi.fn();
      wsManager.on('test_event', callback);

      // Manually emit event (simulating internal emit)
      (wsManager as any).emit('test_event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should allow unsubscribing from events', () => {
      const callback = vi.fn();
      wsManager.on('test_event', callback);
      wsManager.off('test_event', callback);

      (wsManager as any).emit('test_event', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers to same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      wsManager.on('test_event', callback1);
      wsManager.on('test_event', callback2);

      (wsManager as any).emit('test_event', { data: 'test' });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('Message Queuing', () => {
    it('should queue messages when not connected', () => {
      // Not connected, so message should be queued
      wsManager.send('test_event', { data: 'queued' });

      // Check internal queue (accessing private property for testing)
      expect((wsManager as any).messageQueue.length).toBe(1);
      expect((wsManager as any).messageQueue[0]).toEqual({
        event: 'test_event',
        data: { data: 'queued' },
      });
    });
  });

  describe('Room Subscriptions', () => {
    it('should send subscribe_suite message', () => {
      wsManager.subscribeSuite('suite-123');
      
      expect((wsManager as any).messageQueue).toContainEqual({
        event: 'subscribe_suite',
        data: { suiteId: 'suite-123' },
      });
    });

    it('should send unsubscribe_suite message', () => {
      wsManager.unsubscribeSuite('suite-123');
      
      expect((wsManager as any).messageQueue).toContainEqual({
        event: 'unsubscribe_suite',
        data: { suiteId: 'suite-123' },
      });
    });

    it('should send subscribe_task message', () => {
      wsManager.subscribeTask('task-456');
      
      expect((wsManager as any).messageQueue).toContainEqual({
        event: 'subscribe_task',
        data: { taskId: 'task-456' },
      });
    });

    it('should send unsubscribe_task message', () => {
      wsManager.unsubscribeTask('task-456');
      
      expect((wsManager as any).messageQueue).toContainEqual({
        event: 'unsubscribe_task',
        data: { taskId: 'task-456' },
      });
    });
  });

  describe('Token Management', () => {
    it('should update auth token', () => {
      const newToken = 'new-jwt-token';
      wsManager.updateToken(newToken);

      expect((wsManager as any).authToken).toBe(newToken);
    });
  });

  describe('Disconnect', () => {
    it('should set state to DISCONNECTED on disconnect', () => {
      wsManager.connect();
      wsManager.disconnect();

      expect(wsManager.getConnectionState()).toBe('DISCONNECTED');
    });

    it('should emit connectionStateChange on disconnect', () => {
      const callback = vi.fn();
      wsManager.on('connectionStateChange', callback);

      wsManager.connect();
      wsManager.disconnect();

      expect(callback).toHaveBeenCalledWith('DISCONNECTED');
    });
  });
});


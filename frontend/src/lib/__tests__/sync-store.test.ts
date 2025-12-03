/**
 * Sync Store Tests
 * Tests for offline queue management, pending changes, and sync operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSyncStore } from '../store/sync.store';
import { SyncOperation } from '../types/enums';

// Mock the UI store
vi.mock('../store/ui.store', () => ({
  useUIStore: {
    getState: () => ({
      showToast: vi.fn(),
    }),
  },
}));

// Mock the API client
vi.mock('../api/client', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('Sync Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSyncStore.setState({
      isOnline: true,
      lastSyncTime: null,
      pendingChanges: [],
      syncInProgress: false,
      syncError: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Online/Offline State', () => {
    it('should start with online status based on navigator', () => {
      const state = useSyncStore.getState();
      expect(typeof state.isOnline).toBe('boolean');
    });

    it('should update online status', () => {
      useSyncStore.getState().setOnline(false);
      expect(useSyncStore.getState().isOnline).toBe(false);

      useSyncStore.getState().setOnline(true);
      expect(useSyncStore.getState().isOnline).toBe(true);
    });
  });

  describe('Pending Changes', () => {
    it('should add a pending change', () => {
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.CREATE,
        data: { title: 'Test Task' },
      });

      const state = useSyncStore.getState();
      expect(state.pendingChanges.length).toBe(1);
      expect(state.pendingChanges[0].entityType).toBe('task');
      expect(state.pendingChanges[0].entityId).toBe('task-123');
      expect(state.pendingChanges[0].operation).toBe(SyncOperation.CREATE);
    });

    it('should merge CREATE + UPDATE into CREATE with merged data', () => {
      // Add CREATE
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.CREATE,
        data: { title: 'Original Title' },
      });

      // Add UPDATE for same entity
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.UPDATE,
        data: { title: 'Updated Title', priority: 'HIGH' },
      });

      const state = useSyncStore.getState();
      expect(state.pendingChanges.length).toBe(1);
      expect(state.pendingChanges[0].operation).toBe(SyncOperation.CREATE);
      expect(state.pendingChanges[0].data).toEqual({
        title: 'Updated Title',
        priority: 'HIGH',
      });
    });

    it('should remove CREATE when DELETE is added for same entity', () => {
      // Add CREATE
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.CREATE,
        data: { title: 'Test Task' },
      });

      // Add DELETE for same entity
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.DELETE,
        data: {},
      });

      const state = useSyncStore.getState();
      expect(state.pendingChanges.length).toBe(0);
    });

    it('should replace UPDATE with DELETE for same entity', () => {
      // Add UPDATE
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.UPDATE,
        data: { title: 'Updated Title' },
      });

      // Add DELETE for same entity
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.DELETE,
        data: {},
      });

      const state = useSyncStore.getState();
      expect(state.pendingChanges.length).toBe(1);
      expect(state.pendingChanges[0].operation).toBe(SyncOperation.DELETE);
    });

    it('should remove a specific pending change', () => {
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.CREATE,
        data: { title: 'Test Task' },
      });

      const changeId = useSyncStore.getState().pendingChanges[0].id;
      useSyncStore.getState().removePendingChange(changeId);

      expect(useSyncStore.getState().pendingChanges.length).toBe(0);
    });

    it('should clear all pending changes', () => {
      // Add multiple changes
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-1',
        operation: SyncOperation.CREATE,
        data: {},
      });
      useSyncStore.getState().addPendingChange({
        entityType: 'suite',
        entityId: 'suite-1',
        operation: SyncOperation.UPDATE,
        data: {},
      });

      useSyncStore.getState().clearPendingChanges();

      expect(useSyncStore.getState().pendingChanges.length).toBe(0);
    });
  });

  describe('Sync Operations', () => {
    it('should not sync when offline', async () => {
      useSyncStore.getState().setOnline(false);
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.CREATE,
        data: { title: 'Test Task' },
      });

      await useSyncStore.getState().syncPendingChanges();

      // Changes should still be pending
      expect(useSyncStore.getState().pendingChanges.length).toBe(1);
    });

    it('should not sync when already syncing', async () => {
      useSyncStore.setState({ syncInProgress: true });
      
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.CREATE,
        data: { title: 'Test Task' },
      });

      await useSyncStore.getState().syncPendingChanges();

      // Changes should still be pending
      expect(useSyncStore.getState().pendingChanges.length).toBe(1);
    });

    it('should not sync when no pending changes', async () => {
      const initialState = useSyncStore.getState();
      await useSyncStore.getState().syncPendingChanges();

      // State should remain unchanged
      expect(useSyncStore.getState().syncInProgress).toBe(false);
    });

    it('should set sync error message', () => {
      useSyncStore.getState().setSyncError('Test error message');
      expect(useSyncStore.getState().syncError).toBe('Test error message');

      useSyncStore.getState().setSyncError(null);
      expect(useSyncStore.getState().syncError).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should add timestamp to pending changes', () => {
      const beforeTime = new Date().toISOString();

      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-123',
        operation: SyncOperation.CREATE,
        data: {},
      });

      const afterTime = new Date().toISOString();
      const changeTimestamp = useSyncStore.getState().pendingChanges[0].timestamp;

      expect(changeTimestamp >= beforeTime).toBe(true);
      expect(changeTimestamp <= afterTime).toBe(true);
    });

    it('should generate unique IDs for pending changes', () => {
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-1',
        operation: SyncOperation.CREATE,
        data: {},
      });
      useSyncStore.getState().addPendingChange({
        entityType: 'task',
        entityId: 'task-2',
        operation: SyncOperation.CREATE,
        data: {},
      });

      const ids = useSyncStore.getState().pendingChanges.map((c) => c.id);
      expect(ids[0]).not.toBe(ids[1]);
    });
  });
});


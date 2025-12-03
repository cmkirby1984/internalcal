/**
 * Sync Store
 * Manages offline support and pending changes synchronization
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { SyncStore, PendingChange } from '../types/state';
import { SyncOperation } from '../types/enums';
import { defaultStorage } from './middleware/persist-storage';
import { useUIStore } from './ui.store';
import api from '../api/client';

const initialState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncTime: null,
  pendingChanges: [],
  syncInProgress: false,
  syncError: null,
};

export const useSyncStore = create<SyncStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setOnline: (isOnline: boolean) => {
          const wasOffline = !get().isOnline;

          set((state) => {
            state.isOnline = isOnline;
          });

          // Show toast on status change
          if (isOnline && wasOffline) {
            useUIStore.getState().showToast({
              type: 'SUCCESS',
              message: 'Back online. Syncing changes...',
              duration: 3000,
            });

            // Auto-sync pending changes
            if (get().pendingChanges.length > 0) {
              get().syncPendingChanges();
            }
          } else if (!isOnline) {
            useUIStore.getState().showToast({
              type: 'WARNING',
              message: 'You are offline. Changes will sync when reconnected.',
              duration: 5000,
            });
          }
        },

        addPendingChange: (change: Omit<PendingChange, 'id' | 'timestamp'>) => {
          const pendingChange: PendingChange = {
            ...change,
            id: uuidv4(),
            timestamp: new Date().toISOString(),
          };

          set((state) => {
            // Check if there's already a pending change for this entity
            const existingIndex = state.pendingChanges.findIndex(
              (c) => c.entityType === change.entityType && c.entityId === change.entityId
            );

            if (existingIndex >= 0) {
              // Merge with existing change
              const existing = state.pendingChanges[existingIndex];

              // If existing is CREATE and new is UPDATE, keep as CREATE with merged data
              if (existing.operation === SyncOperation.CREATE && change.operation === SyncOperation.UPDATE) {
                state.pendingChanges[existingIndex] = {
                  ...existing,
                  data: { ...existing.data, ...change.data },
                  timestamp: new Date().toISOString(),
                };
              }
              // If existing is CREATE/UPDATE and new is DELETE, replace with DELETE
              else if (change.operation === SyncOperation.DELETE) {
                if (existing.operation === SyncOperation.CREATE) {
                  // Remove from queue entirely if it was never synced
                  state.pendingChanges.splice(existingIndex, 1);
                } else {
                  state.pendingChanges[existingIndex] = pendingChange;
                }
              }
              // Otherwise, replace with new change
              else {
                state.pendingChanges[existingIndex] = pendingChange;
              }
            } else {
              state.pendingChanges.push(pendingChange);
            }
          });
        },

        removePendingChange: (changeId: string) => {
          set((state) => {
            state.pendingChanges = state.pendingChanges.filter((c) => c.id !== changeId);
          });
        },

        syncPendingChanges: async () => {
          const { pendingChanges, isOnline, syncInProgress } = get();

          if (!isOnline || syncInProgress || pendingChanges.length === 0) {
            return;
          }

          set((state) => {
            state.syncInProgress = true;
            state.syncError = null;
          });

          const failedChanges: PendingChange[] = [];

          for (const change of pendingChanges) {
            try {
              const endpoint = `/${change.entityType.toLowerCase()}s`;

              switch (change.operation) {
                case SyncOperation.CREATE:
                  await api.post(endpoint, change.data);
                  break;
                case SyncOperation.UPDATE:
                  await api.patch(`${endpoint}/${change.entityId}`, change.data);
                  break;
                case SyncOperation.DELETE:
                  await api.delete(`${endpoint}/${change.entityId}`);
                  break;
              }
            } catch (error) {
              console.error(`Failed to sync change: ${change.id}`, error);
              failedChanges.push(change);
            }
          }

          set((state) => {
            state.pendingChanges = failedChanges;
            state.syncInProgress = false;
            state.lastSyncTime = new Date().toISOString();

            if (failedChanges.length > 0) {
              state.syncError = `${failedChanges.length} changes failed to sync`;
            }
          });

          // Show result toast
          if (failedChanges.length === 0) {
            useUIStore.getState().showToast({
              type: 'SUCCESS',
              message: 'All changes synced successfully',
              duration: 3000,
            });
          } else {
            useUIStore.getState().showToast({
              type: 'WARNING',
              message: `${failedChanges.length} changes failed to sync`,
              duration: 5000,
            });
          }
        },

        clearPendingChanges: () => {
          set((state) => {
            state.pendingChanges = [];
          });
        },

        setSyncError: (error: string | null) => {
          set((state) => {
            state.syncError = error;
          });
        },
      })),
      {
        name: 'sync-store',
        storage: defaultStorage,
        partialize: (state) => ({
          pendingChanges: state.pendingChanges,
          lastSyncTime: state.lastSyncTime,
        }),
      }
    ),
    { name: 'SyncStore' }
  )
);

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });
}


/**
 * Notifications Store
 * Manages notifications with unread tracking
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { NotificationsStore } from '../types/state';
import type { Notification } from '../types/entities';
import { notificationsApi } from '../api/endpoints';
import { useUIStore } from './ui.store';

const initialState = {
  items: {},
  allIds: [],
  unreadCount: 0,
  unreadIds: [],
  isLoading: false,
  error: null,
};

export const useNotificationsStore = create<NotificationsStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ───────────────────────────────────────────────────────────────────────
      // FETCH OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      fetchNotifications: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const notifications = await notificationsApi.getAll();

          set((state) => {
            notifications.forEach((notification) => {
              state.items[notification.id] = notification;
              if (!state.allIds.includes(notification.id)) {
                state.allIds.push(notification.id);
              }
            });
            state.isLoading = false;
          });

          get().recalculateUnread();
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message || 'Failed to load notifications';
            state.isLoading = false;
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // READ OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      markAsRead: async (notificationId: string) => {
        // Optimistic update
        get().updateNotificationLocal(notificationId, {
          read: true,
          readAt: new Date().toISOString(),
        });
        get().recalculateUnread();

        try {
          await notificationsApi.markAsRead(notificationId);
        } catch {
          // Rollback on error
          get().updateNotificationLocal(notificationId, {
            read: false,
            readAt: null,
          });
          get().recalculateUnread();
        }
      },

      markAllAsRead: async () => {
        const { unreadIds, items } = get();
        const originalStates: Record<string, { read: boolean; readAt: string | null }> = {};

        // Store original states and optimistically update
        unreadIds.forEach((id) => {
          originalStates[id] = {
            read: items[id]?.read || false,
            readAt: items[id]?.readAt || null,
          };
          get().updateNotificationLocal(id, {
            read: true,
            readAt: new Date().toISOString(),
          });
        });
        get().recalculateUnread();

        try {
          await notificationsApi.markAllAsRead();
          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'All notifications marked as read',
            duration: 3000,
          });
        } catch {
          // Rollback all on error
          Object.entries(originalStates).forEach(([id, state]) => {
            get().updateNotificationLocal(id, state);
          });
          get().recalculateUnread();
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to mark notifications as read',
            duration: 5000,
          });
        }
      },

      deleteNotification: async (notificationId: string) => {
        const originalNotification = get().items[notificationId];

        // Optimistic delete
        get().removeNotification(notificationId);

        try {
          await notificationsApi.delete(notificationId);
        } catch {
          // Rollback on error
          if (originalNotification) {
            get().addNotification(originalNotification);
          }
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to delete notification',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // LOCAL UPDATES
      // ───────────────────────────────────────────────────────────────────────

      addNotification: (notification: Notification) => {
        set((state) => {
          state.items[notification.id] = notification;
          if (!state.allIds.includes(notification.id)) {
            state.allIds.unshift(notification.id); // Add to beginning
          }
        });
        get().recalculateUnread();

        // Show toast for new notifications
        useUIStore.getState().showToast({
          type: 'INFO',
          message: notification.title,
          duration: 5000,
        });
      },

      updateNotificationLocal: (notificationId: string, updates: Partial<Notification>) => {
        set((state) => {
          if (state.items[notificationId]) {
            state.items[notificationId] = {
              ...state.items[notificationId],
              ...updates,
            };
          }
        });
      },

      removeNotification: (notificationId: string) => {
        set((state) => {
          delete state.items[notificationId];
          state.allIds = state.allIds.filter((id) => id !== notificationId);
        });
        get().recalculateUnread();
      },

      recalculateUnread: () => {
        set((state) => {
          const unreadIds: string[] = [];

          state.allIds.forEach((id) => {
            const notification = state.items[id];
            if (notification && !notification.read) {
              unreadIds.push(id);
            }
          });

          state.unreadIds = unreadIds;
          state.unreadCount = unreadIds.length;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    { name: 'NotificationsStore' }
  )
);


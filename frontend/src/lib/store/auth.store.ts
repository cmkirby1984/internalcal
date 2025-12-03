/**
 * Auth Store
 * Manages authentication state, user session, and permissions
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AuthStore } from '../types/state';
import { authApi } from '../api/endpoints';
import { tokenStorage } from '../api/client';
import { defaultStorage } from './middleware/persist-storage';

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  token: null,
  permissions: [],
  lastActivity: null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        login: async (username: string, password: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await authApi.login({ username, password });

            tokenStorage.setToken(response.token);

            set((state) => {
              state.currentUser = response.user;
              state.token = response.token;
              state.isAuthenticated = true;
              state.permissions = response.user.permissions;
              state.lastActivity = new Date().toISOString();
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message || 'Login failed';
              state.isLoading = false;
            });
            throw error;
          }
        },

        logout: async () => {
          try {
            // Attempt API logout but don't block on it
            await authApi.logout().catch(() => {});
          } finally {
            // Force clear all local storage to ensure no stale state remains
            if (typeof window !== 'undefined') {
              localStorage.clear();
              tokenStorage.clearAll();
            }

            set(() => ({
              ...initialState,
            }));

            // Force reload to clear in-memory state completely
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        },

        refreshToken: async () => {
          try {
            const response = await authApi.refreshToken();
            tokenStorage.setToken(response.token);
            if (response.refreshToken) {
              tokenStorage.setRefreshToken(response.refreshToken);
            }

            set((state) => {
              state.token = response.token;
            });
          } catch (error) {
            // Token refresh failed, logout
            get().logout();
            throw error;
          }
        },

        updateLastActivity: () => {
          set((state) => {
            state.lastActivity = new Date().toISOString();
          });
        },

        checkPermission: (permission: string) => {
          const { permissions } = get();
          return permissions.includes(permission) || permissions.includes('*');
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },
      })),
      {
        name: 'auth-store',
        storage: defaultStorage,
        partialize: (state) => ({
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
          token: state.token,
          permissions: state.permissions,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Listen for logout events from token refresh failures
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}


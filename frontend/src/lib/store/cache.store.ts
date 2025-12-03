/**
 * Cache Store
 * Manages cached data like dashboard stats, recent activity, and quick access items
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CacheStore, DashboardStats } from '../types/state';
import { defaultStorage } from './middleware/persist-storage';

const initialState = {
  dashboardStats: null,
  recentActivity: [],
  quickAccessSuites: [],
  lastFetchedTimestamps: {},
};

const MAX_RECENT_ACTIVITY = 50;
const MAX_QUICK_ACCESS = 10;

export const useCacheStore = create<CacheStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setDashboardStats: (stats: DashboardStats) => {
          set((state) => {
            state.dashboardStats = stats;
          });
        },

        addRecentActivity: (activity: Record<string, unknown>) => {
          set((state) => {
            // Add to beginning
            state.recentActivity.unshift({
              ...activity,
              timestamp: new Date().toISOString(),
            });

            // Trim to max size
            if (state.recentActivity.length > MAX_RECENT_ACTIVITY) {
              state.recentActivity = state.recentActivity.slice(0, MAX_RECENT_ACTIVITY);
            }
          });
        },

        setQuickAccessSuites: (suiteIds: string[]) => {
          set((state) => {
            // Keep only up to max
            state.quickAccessSuites = suiteIds.slice(0, MAX_QUICK_ACCESS);
          });
        },

        updateLastFetched: (key: string) => {
          set((state) => {
            state.lastFetchedTimestamps[key] = new Date().toISOString();
          });
        },

        clearCache: () => {
          set(() => ({
            ...initialState,
          }));
        },
      })),
      {
        name: 'cache-store',
        storage: defaultStorage,
        partialize: (state) => ({
          quickAccessSuites: state.quickAccessSuites,
          lastFetchedTimestamps: state.lastFetchedTimestamps,
        }),
      }
    ),
    { name: 'CacheStore' }
  )
);

// Helper to check if data needs refresh (e.g., older than 5 minutes)
export const needsRefresh = (key: string, maxAgeMinutes: number = 5): boolean => {
  const timestamp = useCacheStore.getState().lastFetchedTimestamps[key];
  if (!timestamp) return true;

  const age = Date.now() - new Date(timestamp).getTime();
  return age > maxAgeMinutes * 60 * 1000;
};


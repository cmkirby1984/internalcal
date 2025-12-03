/**
 * Suites Store
 * Manages suite state with normalized data structure
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { SuitesStore, SuiteFilters } from '../types/state';
import type { Suite } from '../types/entities';
import { SuiteSortBy, SortOrder, SuiteStatus } from '../types/enums';
import { suitesApi } from '../api/endpoints';
import { useUIStore } from './ui.store';
import { useTasksStore } from './tasks.store';
import { useNotesStore } from './notes.store';

const initialFilters: SuiteFilters = {
  status: null,
  floor: null,
  type: null,
  searchQuery: '',
};

const initialState = {
  items: {},
  allIds: [],
  filters: initialFilters,
  sortBy: SuiteSortBy.SUITE_NUMBER,
  sortOrder: SortOrder.ASC,
  selectedSuiteId: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  needsRefresh: true,
};

export const useSuitesStore = create<SuitesStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ───────────────────────────────────────────────────────────────────────
      // FETCH OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      fetchAllSuites: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const suites = await suitesApi.getAll();
          get().normalizeSuites(suites);

          set((state) => {
            state.lastFetched = new Date().toISOString();
            state.needsRefresh = false;
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message || 'Failed to load suites';
            state.isLoading = false;
          });
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to load suites',
            duration: 5000,
          });
        }
      },

      fetchSuiteById: async (suiteId: string) => {
        try {
          const suite = await suitesApi.getById(suiteId);
          get().updateSuiteLocal(suiteId, suite);
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to load suite',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // CRUD OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      createSuite: async (suiteData: Partial<Suite>) => {
        try {
          const newSuite = await suitesApi.create(suiteData);
          get().addSuite(newSuite);
          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Suite created successfully',
            duration: 3000,
          });
          return newSuite;
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to create suite',
            duration: 5000,
          });
          throw error;
        }
      },

      updateSuite: async (suiteId: string, updates: Partial<Suite>) => {
        const originalSuite = get().items[suiteId];
        
        // Optimistic update
        get().updateSuiteLocal(suiteId, updates);

        try {
          const updatedSuite = await suitesApi.update(suiteId, updates);
          get().updateSuiteLocal(suiteId, updatedSuite);
          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Suite updated',
            duration: 3000,
          });

          // Handle status change side effects
          if (updates.status && updates.status !== originalSuite?.status) {
            get().handleSuiteStatusChange(suiteId, originalSuite?.status, updates.status);
          }
        } catch (error) {
          // Rollback on error
          if (originalSuite) {
            get().updateSuiteLocal(suiteId, originalSuite);
          }
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to update suite',
            duration: 5000,
          });
        }
      },

      updateSuiteStatus: async (suiteId: string, newStatus: SuiteStatus) => {
        await get().updateSuite(suiteId, { status: newStatus });
      },

      deleteSuite: async (suiteId: string) => {
        try {
          await suitesApi.delete(suiteId);
          get().removeSuite(suiteId);
          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Suite deleted',
            duration: 3000,
          });
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to delete suite',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // LOCAL STATE UPDATES
      // ───────────────────────────────────────────────────────────────────────

      normalizeSuites: (suites: Suite[]) => {
        set((state) => {
          suites.forEach((suite) => {
            state.items[suite.id] = suite;
            if (!state.allIds.includes(suite.id)) {
              state.allIds.push(suite.id);
            }
          });
        });
      },

      addSuite: (suite: Suite) => {
        set((state) => {
          state.items[suite.id] = suite;
          if (!state.allIds.includes(suite.id)) {
            state.allIds.push(suite.id);
          }
        });
      },

      updateSuiteLocal: (suiteId: string, updates: Partial<Suite>) => {
        set((state) => {
          if (state.items[suiteId]) {
            state.items[suiteId] = {
              ...state.items[suiteId],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
        });
      },

      removeSuite: (suiteId: string) => {
        set((state) => {
          delete state.items[suiteId];
          state.allIds = state.allIds.filter((id) => id !== suiteId);
          
          if (state.selectedSuiteId === suiteId) {
            state.selectedSuiteId = null;
          }
        });
      },

      // ───────────────────────────────────────────────────────────────────────
      // FILTERING & SORTING
      // ───────────────────────────────────────────────────────────────────────

      setSuiteFilters: (filters: Partial<SuiteFilters>) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      clearSuiteFilters: () => {
        set((state) => {
          state.filters = initialFilters;
        });
      },

      setSuiteSorting: (sortBy: SuiteSortBy, sortOrder: SortOrder) => {
        set((state) => {
          state.sortBy = sortBy;
          state.sortOrder = sortOrder;
        });
      },

      // ───────────────────────────────────────────────────────────────────────
      // SELECTION
      // ───────────────────────────────────────────────────────────────────────

      selectSuite: (suiteId: string | null) => {
        set((state) => {
          state.selectedSuiteId = suiteId;
        });

        // Fetch related data
        if (suiteId) {
          useTasksStore.getState().fetchTasksBySuite(suiteId);
          useNotesStore.getState().fetchNotesBySuite(suiteId);
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // CACHE MANAGEMENT
      // ───────────────────────────────────────────────────────────────────────

      setNeedsRefresh: (needsRefresh: boolean) => {
        set((state) => {
          state.needsRefresh = needsRefresh;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // ───────────────────────────────────────────────────────────────────────
      // BUSINESS LOGIC HELPERS (internal)
      // ───────────────────────────────────────────────────────────────────────

      handleSuiteStatusChange: (
        suiteId: string,
        _oldStatus: SuiteStatus | undefined,
        newStatus: SuiteStatus
      ) => {
        const suite = get().items[suiteId];
        if (!suite) return;

        // When suite becomes vacant/dirty, could trigger cleaning task creation
        if (newStatus === SuiteStatus.VACANT_DIRTY) {
          // Task creation would be handled by backend or could dispatch here
          console.log(`Suite ${suite.suiteNumber} needs cleaning`);
        }

        // When suite goes out of order, log for maintenance notification
        if (newStatus === SuiteStatus.OUT_OF_ORDER) {
          console.log(`Suite ${suite.suiteNumber} is out of order`);
        }
      },
    })),
    { name: 'SuitesStore' }
  )
);


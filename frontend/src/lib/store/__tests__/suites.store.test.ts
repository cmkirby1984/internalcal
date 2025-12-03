import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSuitesStore } from '../suites.store';
import { SuiteStatus, SuiteType, BedConfiguration, SuiteSortBy, SortOrder } from '../../types/enums';
import type { Suite } from '../../types/entities';

// Mock the API
vi.mock('../../api/endpoints', () => ({
  suitesApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the UI store
vi.mock('../ui.store', () => ({
  useUIStore: {
    getState: () => ({
      showToast: vi.fn(),
    }),
  },
}));

// Mock tasks and notes stores
vi.mock('../tasks.store', () => ({
  useTasksStore: {
    getState: () => ({
      fetchTasksBySuite: vi.fn(),
    }),
  },
}));

vi.mock('../notes.store', () => ({
  useNotesStore: {
    getState: () => ({
      fetchNotesBySuite: vi.fn(),
    }),
  },
}));

const createMockSuite = (overrides: Partial<Suite> = {}): Suite => ({
  id: 'suite-1',
  suiteNumber: '101',
  floor: 1,
  type: SuiteType.STANDARD,
  status: SuiteStatus.VACANT_CLEAN,
  currentGuest: null,
  bedConfiguration: BedConfiguration.QUEEN,
  amenities: ['WiFi', 'TV'],
  squareFeet: 300,
  lastCleaned: '2024-01-01T00:00:00Z',
  lastInspected: '2024-01-01T00:00:00Z',
  nextScheduledMaintenance: null,
  notes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('SuitesStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSuitesStore.setState({
      items: {},
      allIds: [],
      filters: {
        status: null,
        floor: null,
        type: null,
        searchQuery: '',
      },
      sortBy: SuiteSortBy.SUITE_NUMBER,
      sortOrder: SortOrder.ASC,
      selectedSuiteId: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      needsRefresh: true,
    });
  });

  describe('normalizeSuites', () => {
    it('should normalize suites into the store', () => {
      const suites = [
        createMockSuite({ id: 'suite-1', suiteNumber: '101' }),
        createMockSuite({ id: 'suite-2', suiteNumber: '102' }),
      ];

      useSuitesStore.getState().normalizeSuites(suites);

      const state = useSuitesStore.getState();
      expect(state.allIds).toHaveLength(2);
      expect(state.items['suite-1'].suiteNumber).toBe('101');
      expect(state.items['suite-2'].suiteNumber).toBe('102');
    });

    it('should not duplicate suite IDs', () => {
      const suite = createMockSuite({ id: 'suite-1' });

      useSuitesStore.getState().normalizeSuites([suite]);
      useSuitesStore.getState().normalizeSuites([suite]);

      const state = useSuitesStore.getState();
      expect(state.allIds).toHaveLength(1);
    });
  });

  describe('addSuite', () => {
    it('should add a new suite', () => {
      const suite = createMockSuite();

      useSuitesStore.getState().addSuite(suite);

      const state = useSuitesStore.getState();
      expect(state.allIds).toContain('suite-1');
      expect(state.items['suite-1']).toEqual(suite);
    });
  });

  describe('updateSuiteLocal', () => {
    it('should update suite properties', () => {
      const suite = createMockSuite();
      useSuitesStore.getState().addSuite(suite);

      useSuitesStore.getState().updateSuiteLocal('suite-1', {
        status: SuiteStatus.VACANT_DIRTY,
      });

      const state = useSuitesStore.getState();
      expect(state.items['suite-1'].status).toBe(SuiteStatus.VACANT_DIRTY);
    });

    it('should update the updatedAt timestamp', () => {
      const suite = createMockSuite();
      useSuitesStore.getState().addSuite(suite);

      const beforeUpdate = suite.updatedAt;
      useSuitesStore.getState().updateSuiteLocal('suite-1', { notes: 'Updated' });

      const state = useSuitesStore.getState();
      expect(state.items['suite-1'].updatedAt).not.toBe(beforeUpdate);
    });
  });

  describe('removeSuite', () => {
    it('should remove a suite', () => {
      const suite = createMockSuite();
      useSuitesStore.getState().addSuite(suite);

      useSuitesStore.getState().removeSuite('suite-1');

      const state = useSuitesStore.getState();
      expect(state.allIds).not.toContain('suite-1');
      expect(state.items['suite-1']).toBeUndefined();
    });

    it('should clear selectedSuiteId if the removed suite was selected', () => {
      const suite = createMockSuite();
      useSuitesStore.getState().addSuite(suite);
      useSuitesStore.getState().selectSuite('suite-1');

      useSuitesStore.getState().removeSuite('suite-1');

      const state = useSuitesStore.getState();
      expect(state.selectedSuiteId).toBeNull();
    });
  });

  describe('filters', () => {
    it('should set filters', () => {
      useSuitesStore.getState().setSuiteFilters({
        status: [SuiteStatus.VACANT_CLEAN],
        floor: [1, 2],
      });

      const state = useSuitesStore.getState();
      expect(state.filters.status).toEqual([SuiteStatus.VACANT_CLEAN]);
      expect(state.filters.floor).toEqual([1, 2]);
    });

    it('should clear filters', () => {
      useSuitesStore.getState().setSuiteFilters({
        status: [SuiteStatus.VACANT_CLEAN],
        searchQuery: 'test',
      });

      useSuitesStore.getState().clearSuiteFilters();

      const state = useSuitesStore.getState();
      expect(state.filters.status).toBeNull();
      expect(state.filters.searchQuery).toBe('');
    });
  });

  describe('sorting', () => {
    it('should set sorting', () => {
      useSuitesStore.getState().setSuiteSorting(SuiteSortBy.FLOOR, SortOrder.DESC);

      const state = useSuitesStore.getState();
      expect(state.sortBy).toBe(SuiteSortBy.FLOOR);
      expect(state.sortOrder).toBe(SortOrder.DESC);
    });
  });

  describe('selection', () => {
    it('should select a suite', () => {
      const suite = createMockSuite();
      useSuitesStore.getState().addSuite(suite);

      useSuitesStore.getState().selectSuite('suite-1');

      const state = useSuitesStore.getState();
      expect(state.selectedSuiteId).toBe('suite-1');
    });

    it('should deselect a suite', () => {
      useSuitesStore.getState().selectSuite('suite-1');
      useSuitesStore.getState().selectSuite(null);

      const state = useSuitesStore.getState();
      expect(state.selectedSuiteId).toBeNull();
    });
  });

  describe('cache management', () => {
    it('should set needsRefresh', () => {
      useSuitesStore.getState().setNeedsRefresh(true);
      expect(useSuitesStore.getState().needsRefresh).toBe(true);

      useSuitesStore.getState().setNeedsRefresh(false);
      expect(useSuitesStore.getState().needsRefresh).toBe(false);
    });

    it('should clear error', () => {
      useSuitesStore.setState({ error: 'Test error' });
      useSuitesStore.getState().clearError();

      expect(useSuitesStore.getState().error).toBeNull();
    });
  });
});


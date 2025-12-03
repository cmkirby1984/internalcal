/**
 * Suites Selectors
 * Computed/derived state for suites
 */

import { useSuitesStore } from '../suites.store';
import type { Suite } from '../../types/entities';
import { SuiteStatus, SuiteSortBy, SortOrder } from '../../types/enums';

/**
 * Get all suites as an array
 */
export const useAllSuites = (): Suite[] => {
  return useSuitesStore((state) =>
    state.allIds.map((id) => state.items[id]).filter(Boolean)
  );
};

/**
 * Get filtered and sorted suites based on current filters
 */
export const useFilteredSuites = (): Suite[] => {
  return useSuitesStore((state) => {
    const { items, allIds, filters, sortBy, sortOrder } = state;

    let filtered = allIds.map((id) => items[id]).filter(Boolean);

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((suite) => filters.status!.includes(suite.status));
    }

    // Apply floor filter
    if (filters.floor && filters.floor.length > 0) {
      filtered = filtered.filter((suite) => filters.floor!.includes(suite.floor));
    }

    // Apply type filter
    if (filters.type && filters.type.length > 0) {
      filtered = filtered.filter((suite) => filters.type!.includes(suite.type));
    }

    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (suite) =>
          suite.suiteNumber.toLowerCase().includes(query) ||
          suite.currentGuest?.name?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case SuiteSortBy.SUITE_NUMBER:
          comparison = a.suiteNumber.localeCompare(b.suiteNumber, undefined, {
            numeric: true,
          });
          break;
        case SuiteSortBy.STATUS:
          comparison = a.status.localeCompare(b.status);
          break;
        case SuiteSortBy.FLOOR:
          comparison = a.floor - b.floor;
          break;
        case SuiteSortBy.LAST_CLEANED:
          const aDate = a.lastCleaned ? new Date(a.lastCleaned).getTime() : 0;
          const bDate = b.lastCleaned ? new Date(b.lastCleaned).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }

      return sortOrder === SortOrder.ASC ? comparison : -comparison;
    });

    return filtered;
  });
};

/**
 * Get suites by status
 */
export const useSuitesByStatus = (status: SuiteStatus): Suite[] => {
  return useSuitesStore((state) =>
    state.allIds
      .map((id) => state.items[id])
      .filter((suite) => suite && suite.status === status)
  );
};

/**
 * Get vacant clean suites
 */
export const useVacantCleanSuites = (): Suite[] => {
  return useSuitesByStatus(SuiteStatus.VACANT_CLEAN);
};

/**
 * Get suites needing cleaning
 */
export const useSuitesNeedingCleaning = (): Suite[] => {
  return useSuitesStore((state) =>
    state.allIds
      .map((id) => state.items[id])
      .filter(
        (suite) =>
          suite &&
          (suite.status === SuiteStatus.VACANT_DIRTY ||
            suite.status === SuiteStatus.OCCUPIED_DIRTY)
      )
  );
};

/**
 * Get suites grouped by floor
 */
export const useSuitesByFloor = (): Record<number, Suite[]> => {
  return useSuitesStore((state) => {
    const byFloor: Record<number, Suite[]> = {};

    state.allIds.forEach((id) => {
      const suite = state.items[id];
      if (suite) {
        if (!byFloor[suite.floor]) {
          byFloor[suite.floor] = [];
        }
        byFloor[suite.floor].push(suite);
      }
    });

    return byFloor;
  });
};

/**
 * Get suites grouped by status
 */
export const useSuitesByStatusGroup = (): Record<SuiteStatus, Suite[]> => {
  return useSuitesStore((state) => {
    const byStatus = {} as Record<SuiteStatus, Suite[]>;

    Object.values(SuiteStatus).forEach((status) => {
      byStatus[status] = [];
    });

    state.allIds.forEach((id) => {
      const suite = state.items[id];
      if (suite) {
        byStatus[suite.status].push(suite);
      }
    });

    return byStatus;
  });
};

/**
 * Get selected suite
 */
export const useSelectedSuite = (): Suite | null => {
  return useSuitesStore((state) =>
    state.selectedSuiteId ? state.items[state.selectedSuiteId] : null
  );
};

/**
 * Get suite by ID
 */
export const useSuiteById = (suiteId: string | null): Suite | null => {
  return useSuitesStore((state) => (suiteId ? state.items[suiteId] : null));
};

/**
 * Get unique floor numbers
 */
export const useUniqueFloors = (): number[] => {
  return useSuitesStore((state) => {
    const floors = new Set<number>();
    state.allIds.forEach((id) => {
      const suite = state.items[id];
      if (suite) {
        floors.add(suite.floor);
      }
    });
    return Array.from(floors).sort((a, b) => a - b);
  });
};

/**
 * Get suite status counts
 */
export const useSuiteStatusCounts = (): Record<SuiteStatus, number> => {
  return useSuitesStore((state) => {
    const counts = {} as Record<SuiteStatus, number>;

    Object.values(SuiteStatus).forEach((status) => {
      counts[status] = 0;
    });

    state.allIds.forEach((id) => {
      const suite = state.items[id];
      if (suite) {
        counts[suite.status]++;
      }
    });

    return counts;
  });
};

/**
 * Calculate occupancy rate
 */
export const useOccupancyRate = (): number => {
  return useSuitesStore((state) => {
    const total = state.allIds.length;
    if (total === 0) return 0;

    const occupied = state.allIds.filter((id) => {
      const suite = state.items[id];
      return (
        suite &&
        (suite.status === SuiteStatus.OCCUPIED_CLEAN ||
          suite.status === SuiteStatus.OCCUPIED_DIRTY)
      );
    }).length;

    return Math.round((occupied / total) * 100);
  });
};


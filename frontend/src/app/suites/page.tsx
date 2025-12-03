'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { SuiteGrid, SuiteFilters } from '@/components/suites';
import { useSuitesStore, useUIStore } from '@/lib/store';
import { UISuite, SuiteStatus, SuiteType } from '@/lib/types';

/* ─────────────────────────────────────────────────────────────────────────────
   SUITES PAGE
   ───────────────────────────────────────────────────────────────────────────── */

type ViewMode = 'grid' | 'list' | 'floor';

export default function SuitesPage() {
  const router = useRouter();
  const openModal = useUIStore((state) => state.openModal);
  
  // Store state
  const suitesMap = useSuitesStore((state) => state.items);
  const isLoading = useSuitesStore((state) => state.isLoading);
  const fetchAllSuites = useSuitesStore((state) => state.fetchAllSuites);
  const updateSuiteStatus = useSuitesStore((state) => state.updateSuiteStatus);

  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    status?: SuiteStatus[];
    floor?: number[];
    type?: SuiteType[];
    needsCleaning?: boolean;
  }>({});

  // Fetch data on mount
  useEffect(() => {
    fetchAllSuites();
  }, [fetchAllSuites]);

  // Convert map to array
  const suites = useMemo(() => Object.values(suitesMap).map(suite => ({
    ...suite,
    maxOccupancy: 2, // Default occupancy, not yet in backend
    activeTasks: [], // Not yet implemented
    notes: suite.notes ? [suite.notes] : [], // Convert string to array
  })), [suitesMap]);

  // Filter suites
  const filteredSuites = useMemo(() => {
    return suites.filter((suite) => {
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(suite.status)) return false;
      }
      if (filters.floor && filters.floor.length > 0) {
        if (!filters.floor.includes(suite.floor)) return false;
      }
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(suite.type)) return false;
      }
      if (filters.needsCleaning) {
        if (suite.status !== SuiteStatus.VACANT_DIRTY && suite.status !== SuiteStatus.OCCUPIED_DIRTY) {
          return false;
        }
      }
      return true;
    });
  }, [suites, filters]);

  const handleFilterChange = (key: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleSuiteClick = (suite: UISuite) => {
    router.push(`/suites/${suite.id}`);
  };

  const handleStatusChange = async (suiteId: string, status: SuiteStatus) => {
    await updateSuiteStatus(suiteId, status);
  };

  const handleCreateSuite = () => {
    openModal('create-suite');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Suites</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {filteredSuites.length} of {suites.length} suites
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--primary-100)] text-[var(--primary-700)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--primary-100)] text-[var(--primary-700)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            }
          >
            Filters
          </Button>

          {/* Add Suite */}
          <Button
            onClick={handleCreateSuite}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Suite
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <SuiteFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Quick Status Filters */}
      <div className="flex flex-wrap gap-2">
        {Object.values(SuiteStatus).map((status) => {
          const count = suites.filter((s) => s.status === status).length;
          const isActive = filters.status?.includes(status);
          
          return (
            <button
              key={status}
              onClick={() => {
                if (isActive) {
                  handleFilterChange('status', filters.status?.filter((s) => s !== status) || []);
                } else {
                  handleFilterChange('status', [...(filters.status || []), status]);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--primary-600)] text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)]'
              }`}
            >
              {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} ({count})
            </button>
          );
        })}
      </div>

      {/* Suites Grid */}
      <SuiteGrid
        suites={filteredSuites}
        isLoading={isLoading}
        onSuiteClick={handleSuiteClick}
        onStatusChange={handleStatusChange}
        onCreateSuite={handleCreateSuite}
      />
    </div>
  );
}


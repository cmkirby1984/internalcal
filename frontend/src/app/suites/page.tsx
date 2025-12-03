'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { SuiteGrid, SuiteFilters } from '@/components/suites';
import { useSuitesStore, useUIStore } from '@/lib/store';
import { UISuite, SuiteStatus, SuiteType } from '@/lib/types';

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK DATA (Replace with real API calls)
   ───────────────────────────────────────────────────────────────────────────── */

const mockSuites: UISuite[] = [
  {
    id: '1',
    suiteNumber: '101',
    floor: 1,
    type: SuiteType.STANDARD,
    status: SuiteStatus.VACANT_CLEAN,
    bedConfiguration: '1 King Bed',
    amenities: ['TV', 'WiFi', 'AC'],
    maxOccupancy: 2,
    currentGuest: null,
    lastCleaned: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    activeTasks: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    suiteNumber: '102',
    floor: 1,
    type: SuiteType.STANDARD,
    status: SuiteStatus.OCCUPIED_CLEAN,
    bedConfiguration: '2 Queen Beds',
    amenities: ['TV', 'WiFi', 'AC'],
    maxOccupancy: 4,
    currentGuest: {
      name: 'John Smith',
      checkIn: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    lastCleaned: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    activeTasks: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    suiteNumber: '103',
    floor: 1,
    type: SuiteType.DELUXE,
    status: SuiteStatus.VACANT_DIRTY,
    bedConfiguration: '1 King Bed',
    amenities: ['TV', 'WiFi', 'AC', 'Mini Bar'],
    maxOccupancy: 2,
    currentGuest: null,
    lastCleaned: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    activeTasks: ['task-1'],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    suiteNumber: '201',
    floor: 2,
    type: SuiteType.SUITE,
    status: SuiteStatus.OCCUPIED_DIRTY,
    bedConfiguration: '1 King Bed + Sofa',
    amenities: ['TV', 'WiFi', 'AC', 'Mini Bar', 'Jacuzzi'],
    maxOccupancy: 3,
    currentGuest: {
      name: 'Sarah Johnson',
      checkIn: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    },
    lastCleaned: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    activeTasks: ['task-2'],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    suiteNumber: '202',
    floor: 2,
    type: SuiteType.STANDARD,
    status: SuiteStatus.OUT_OF_ORDER,
    bedConfiguration: '2 Double Beds',
    amenities: ['TV', 'WiFi', 'AC'],
    maxOccupancy: 4,
    currentGuest: null,
    lastCleaned: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    activeTasks: ['task-3'],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    suiteNumber: '203',
    floor: 2,
    type: SuiteType.ACCESSIBLE,
    status: SuiteStatus.VACANT_CLEAN,
    bedConfiguration: '1 King Bed',
    amenities: ['TV', 'WiFi', 'AC', 'Accessible Bathroom'],
    maxOccupancy: 2,
    currentGuest: null,
    lastCleaned: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    activeTasks: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    suiteNumber: '301',
    floor: 3,
    type: SuiteType.SUITE,
    status: SuiteStatus.BLOCKED,
    bedConfiguration: '1 King Bed + 2 Queen Beds',
    amenities: ['TV', 'WiFi', 'AC', 'Mini Bar', 'Jacuzzi', 'Kitchen', 'Balcony'],
    maxOccupancy: 6,
    currentGuest: null,
    lastCleaned: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    activeTasks: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    suiteNumber: '302',
    floor: 3,
    type: SuiteType.DELUXE,
    status: SuiteStatus.OCCUPIED_CLEAN,
    bedConfiguration: '1 King Bed',
    amenities: ['TV', 'WiFi', 'AC', 'Mini Bar'],
    maxOccupancy: 2,
    currentGuest: {
      name: 'Michael Brown',
      checkIn: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    lastCleaned: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    activeTasks: [],
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   SUITES PAGE
   ───────────────────────────────────────────────────────────────────────────── */

type ViewMode = 'grid' | 'list' | 'floor';

export default function SuitesPage() {
  const router = useRouter();
  const openModal = useUIStore((state) => state.openModal);
  
  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    status?: SuiteStatus[];
    floor?: number[];
    type?: SuiteType[];
    needsCleaning?: boolean;
  }>({});

  // Use mock data for now
  const suites = mockSuites;
  const isLoading = false;

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

  const handleStatusChange = (suiteId: string, status: SuiteStatus) => {
    // TODO: Implement status change
    console.log('Status change:', suiteId, status);
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


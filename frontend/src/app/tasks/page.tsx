'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { TaskList, TaskKanban, TaskFilters } from '@/components/tasks';
import { useTasksStore, useUIStore } from '@/lib/store';
import { UITask, TaskStatus, TaskPriority, TaskType } from '@/lib/types';

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK DATA (Replace with real API calls)
   ───────────────────────────────────────────────────────────────────────────── */

const mockTasks: UITask[] = [
  {
    id: '1',
    type: TaskType.CLEANING,
    priority: TaskPriority.NORMAL,
    status: TaskStatus.PENDING,
    title: 'Clean Suite 103',
    description: 'Standard checkout cleaning with fresh linens',
    suiteId: '3',
    assignedTo: null,
    createdBy: 'admin',
    scheduledStart: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    scheduledEnd: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    estimatedDuration: 45,
    actualDuration: null,
    notes: [],
    checklist: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: TaskType.MAINTENANCE,
    priority: TaskPriority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    title: 'Fix AC Unit in Suite 201',
    description: 'Guest reported AC not cooling properly',
    suiteId: '4',
    assignedTo: 'John Smith',
    createdBy: 'admin',
    scheduledStart: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    scheduledEnd: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    estimatedDuration: 120,
    actualDuration: null,
    notes: [],
    checklist: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    type: TaskType.CUSTOM,
    priority: TaskPriority.URGENT,
    status: TaskStatus.ASSIGNED,
    title: 'Extra Towels for Suite 302',
    description: 'Guest requested 4 extra bath towels',
    suiteId: '8',
    assignedTo: 'Maria Garcia',
    createdBy: 'admin',
    scheduledStart: new Date().toISOString(),
    scheduledEnd: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    estimatedDuration: 10,
    actualDuration: null,
    notes: [],
    checklist: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    type: TaskType.INSPECTION,
    priority: TaskPriority.NORMAL,
    status: TaskStatus.COMPLETED,
    title: 'Room Inspection - Suite 101',
    description: 'Post-cleaning quality inspection',
    suiteId: '1',
    assignedTo: 'Sarah Johnson',
    createdBy: 'admin',
    scheduledStart: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    scheduledEnd: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    estimatedDuration: 15,
    actualDuration: 12,
    notes: [],
    checklist: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '5',
    type: TaskType.CUSTOM,
    priority: TaskPriority.LOW,
    status: TaskStatus.PENDING,
    title: 'Restock Mini Bar - Suite 201',
    description: 'Standard mini bar restocking',
    suiteId: '4',
    assignedTo: null,
    createdBy: 'admin',
    scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    scheduledEnd: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    estimatedDuration: 15,
    actualDuration: null,
    notes: [],
    checklist: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    type: TaskType.MAINTENANCE,
    priority: TaskPriority.EMERGENCY,
    status: TaskStatus.IN_PROGRESS,
    title: 'Water Leak - Suite 202',
    description: 'Bathroom pipe leak, needs immediate attention',
    suiteId: '5',
    assignedTo: 'Mike Wilson',
    createdBy: 'admin',
    scheduledStart: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    scheduledEnd: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    estimatedDuration: 60,
    actualDuration: null,
    notes: [],
    checklist: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    type: TaskType.LINEN_CHANGE,
    priority: TaskPriority.NORMAL,
    status: TaskStatus.ASSIGNED,
    title: 'Collect Laundry - Floor 3',
    description: 'Collect all dirty linens from floor 3 suites',
    suiteId: null,
    assignedTo: 'Emily Davis',
    createdBy: 'admin',
    scheduledStart: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    scheduledEnd: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    estimatedDuration: 45,
    actualDuration: null,
    notes: [],
    checklist: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    type: TaskType.CLEANING,
    priority: TaskPriority.HIGH,
    status: TaskStatus.PENDING,
    title: 'Deep Clean Suite 301',
    description: 'Monthly deep cleaning for penthouse suite',
    suiteId: '7',
    assignedTo: null,
    createdBy: 'admin',
    scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    scheduledEnd: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
    estimatedDuration: 180,
    actualDuration: null,
    notes: [],
    checklist: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   TASKS PAGE
   ───────────────────────────────────────────────────────────────────────────── */

type ViewMode = 'list' | 'kanban';

export default function TasksPage() {
  const router = useRouter();
  const openModal = useUIStore((state) => state.openModal);
  
  // Local state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    status?: TaskStatus[];
    priority?: TaskPriority[];
    type?: TaskType[];
    assignedTo?: string;
    overdue?: boolean;
  }>({});

  // Use mock data for now
  const tasks = mockTasks;
  const isLoading = false;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(task.status)) return false;
      }
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(task.priority)) return false;
      }
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(task.type)) return false;
      }
      if (filters.overdue) {
        if (!task.scheduledEnd || new Date(task.scheduledEnd) >= now) return false;
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  const handleFilterChange = (key: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleTaskClick = (task: UITask) => {
    router.push(`/tasks/${task.id}`);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    // TODO: Implement status change
    console.log('Status change:', taskId, status);
  };

  const handleCreateTask = () => {
    openModal('create-task');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tasks</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-1">
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
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[var(--primary-100)] text-[var(--primary-700)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
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

          {/* Create Task */}
          <Button
            onClick={handleCreateTask}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <TaskFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange('assignedTo', 'me')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filters.assignedTo === 'me'
              ? 'bg-[var(--primary-600)] text-white'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)]'
          }`}
        >
          My Tasks
        </button>
        <button
          onClick={() => handleFilterChange('status', [TaskStatus.PENDING])}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filters.status?.includes(TaskStatus.PENDING)
              ? 'bg-[var(--primary-600)] text-white'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)]'
          }`}
        >
          Unassigned
        </button>
        <button
          onClick={() => handleFilterChange('overdue', !filters.overdue)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filters.overdue
              ? 'bg-red-600 text-white'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)]'
          }`}
        >
          Overdue
        </button>
        <button
          onClick={() => handleFilterChange('priority', [TaskPriority.URGENT, TaskPriority.EMERGENCY])}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filters.priority?.includes(TaskPriority.URGENT)
              ? 'bg-orange-600 text-white'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)]'
          }`}
        >
          Urgent
        </button>
      </div>

      {/* Tasks View */}
      {viewMode === 'list' ? (
        <TaskList
          tasks={filteredTasks}
          isLoading={isLoading}
          onTaskClick={handleTaskClick}
          onStatusChange={handleStatusChange}
          onCreateTask={handleCreateTask}
        />
      ) : (
        <TaskKanban
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onTaskMove={handleStatusChange}
        />
      )}
    </div>
  );
}


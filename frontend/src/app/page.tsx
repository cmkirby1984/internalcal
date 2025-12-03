'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, Button } from '@/components/ui';
import { StatCard, SuiteStatusChart, ActivityFeed, QuickTaskList } from '@/components/dashboard';
import { useSuitesStore, useTasksStore, useEmployeesStore, useAuthStore } from '@/lib/store';
import { TaskStatus, TaskPriority, SuiteStatus, UITask } from '@/lib/types';

/* ─────────────────────────────────────────────────────────────────────────────
   DASHBOARD PAGE
   ───────────────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  
  // Get data from stores
  const suitesItems = useSuitesStore((state) => state.items);
  const suitesLoading = useSuitesStore((state) => state.isLoading);
  const fetchAllSuites = useSuitesStore((state) => state.fetchAllSuites);
  
  const tasksItems = useTasksStore((state) => state.items);
  const tasksLoading = useTasksStore((state) => state.isLoading);
  const fetchAllTasks = useTasksStore((state) => state.fetchAllTasks);
  
  const employeesItems = useEmployeesStore((state) => state.items);
  const employeesLoading = useEmployeesStore((state) => state.isLoading);
  const fetchAllEmployees = useEmployeesStore((state) => state.fetchAllEmployees);

  // Fetch data on mount
  useEffect(() => {
    fetchAllSuites();
    fetchAllTasks();
    fetchAllEmployees();
  }, [fetchAllSuites, fetchAllTasks, fetchAllEmployees]);

  const isLoading = suitesLoading || tasksLoading || employeesLoading;

  // Calculate suite statistics
  const suiteStats = useMemo(() => {
    const suitesArray = Object.values(suitesItems);
    const total = suitesArray.length;
    
    return {
      total,
      vacantClean: suitesArray.filter(s => s.status === SuiteStatus.VACANT_CLEAN).length,
      vacantDirty: suitesArray.filter(s => s.status === SuiteStatus.VACANT_DIRTY).length,
      occupiedClean: suitesArray.filter(s => s.status === SuiteStatus.OCCUPIED_CLEAN).length,
      occupiedDirty: suitesArray.filter(s => s.status === SuiteStatus.OCCUPIED_DIRTY).length,
      outOfOrder: suitesArray.filter(s => s.status === SuiteStatus.OUT_OF_ORDER).length,
      blocked: suitesArray.filter(s => s.status === SuiteStatus.BLOCKED).length,
    };
  }, [suitesItems]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const tasksArray = Object.values(tasksItems);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return {
      total: tasksArray.length,
      pending: tasksArray.filter(t => t.status === TaskStatus.PENDING).length,
      inProgress: tasksArray.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      completed: tasksArray.filter(t => t.status === TaskStatus.COMPLETED).length,
      completedToday: tasksArray.filter(t => 
        t.status === TaskStatus.COMPLETED && 
        t.completedAt && 
        new Date(t.completedAt) >= todayStart
      ).length,
      overdue: tasksArray.filter(t => 
        t.scheduledEnd && new Date(t.scheduledEnd) < now && 
        t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
      ).length,
    };
  }, [tasksItems]);

  // Get urgent tasks
  const urgentTasks: UITask[] = useMemo(() => {
    const tasksArray = Object.values(tasksItems) as UITask[];
    return tasksArray
      .filter(t => 
        (t.priority === TaskPriority.URGENT || t.priority === TaskPriority.EMERGENCY) &&
        t.status !== TaskStatus.COMPLETED && 
        t.status !== TaskStatus.CANCELLED
      )
      .slice(0, 5);
  }, [tasksItems]);

  // Get current user's active tasks
  const myTasks: UITask[] = useMemo(() => {
    if (!currentUser?.id) return [];
    const tasksArray = Object.values(tasksItems) as UITask[];
    return tasksArray
      .filter(t => 
        t.assignedToId === currentUser.id &&
        t.status !== TaskStatus.COMPLETED && 
        t.status !== TaskStatus.CANCELLED
      )
      .slice(0, 5);
  }, [tasksItems, currentUser?.id]);

  // Employee stats
  const employeeStats = useMemo(() => {
    const employeesArray = Object.values(employeesItems);
    return {
      total: employeesArray.length,
      onDuty: employeesArray.filter(e => e.isOnDuty).length,
    };
  }, [employeesItems]);

  // Build activity feed from recent tasks
  const activities = useMemo(() => {
    const tasksArray = Object.values(tasksItems);
    return tasksArray
      .filter(t => t.updatedAt)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        type: task.status === TaskStatus.COMPLETED ? 'task_completed' as const :
              task.status === TaskStatus.ASSIGNED ? 'task_assigned' as const :
              'suite_cleaned' as const,
        message: `${task.title}${task.suiteNumber ? ` - Suite ${task.suiteNumber}` : ''}`,
        user: { name: task.assignedTo || 'System' },
        timestamp: task.updatedAt!,
      }));
  }, [tasksItems]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Welcome back{currentUser?.firstName ? `, ${currentUser.firstName}` : ''}!
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Here&apos;s what&apos;s happening at your property today.
          </p>
        </div>
        <Button
          onClick={() => router.push('/tasks')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          New Task
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--text-secondary)]">Loading dashboard data...</span>
          </div>
        </div>
      )}

      {/* Stats Grid - Suite Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Suites"
          value={suiteStats.total}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          color="info"
          onClick={() => router.push('/suites')}
        />
        <StatCard
          title="Available"
          value={suiteStats.vacantClean}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
          color="success"
          onClick={() => router.push('/suites?status=VACANT_CLEAN')}
        />
        <StatCard
          title="Needs Cleaning"
          value={suiteStats.vacantDirty + suiteStats.occupiedDirty}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
          color="warning"
          onClick={() => router.push('/suites?needsCleaning=true')}
        />
        <StatCard
          title="Out of Order"
          value={suiteStats.outOfOrder}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          color="error"
          onClick={() => router.push('/suites?status=OUT_OF_ORDER')}
        />
      </div>

      {/* Stats Grid - Task & Employee Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Tasks"
          value={taskStats.inProgress}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="info"
          onClick={() => router.push('/tasks?status=IN_PROGRESS')}
        />
        <StatCard
          title="Completed Today"
          value={taskStats.completedToday}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="success"
          trend={taskStats.completedToday > 0 ? { value: taskStats.completedToday, isPositive: true } : undefined}
        />
        <StatCard
          title="Overdue"
          value={taskStats.overdue}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="error"
          onClick={() => router.push('/tasks?overdue=true')}
        />
        <StatCard
          title="On Duty"
          value={`${employeeStats.onDuty}/${employeeStats.total}`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          color="primary"
          onClick={() => router.push('/employees')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Tasks */}
          <Card padding="lg">
            <CardHeader
              title="My Tasks"
              subtitle={`${myTasks.length} active tasks`}
              action={
                <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
                  View All
                </Button>
              }
            />
            <CardContent>
              <QuickTaskList
                tasks={myTasks}
                onTaskClick={(task) => router.push(`/tasks/${task.id}`)}
              />
            </CardContent>
          </Card>

          {/* Urgent Tasks */}
          {urgentTasks.length > 0 && (
            <Card padding="lg" className="border-l-4 border-l-red-500">
              <CardHeader
                title="Urgent Tasks"
                subtitle="Requires immediate attention"
                action={
                  <Button variant="ghost" size="sm" onClick={() => router.push('/tasks?priority=URGENT')}>
                    View All
                  </Button>
                }
              />
              <CardContent>
                <QuickTaskList
                  tasks={urgentTasks}
                  onTaskClick={(task) => router.push(`/tasks/${task.id}`)}
                  compact
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Suite Status Chart */}
          <Card padding="lg">
            <CardHeader title="Suite Status" />
            <CardContent>
              <SuiteStatusChart stats={suiteStats} />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card padding="lg">
            <CardHeader
              title="Recent Activity"
              action={
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              }
            />
            <CardContent>
              <ActivityFeed activities={activities} limit={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

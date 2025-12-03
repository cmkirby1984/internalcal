'use client';

/**
 * Store Provider
 * Initializes stores and provides hydration from persisted state
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useSuitesStore } from '../store/suites.store';
import { useTasksStore } from '../store/tasks.store';
import { useEmployeesStore } from '../store/employees.store';
import { useNotesStore } from '../store/notes.store';
import { useNotificationsStore } from '../store/notifications.store';
import { useSyncStore } from '../store/sync.store';
import { useUIStore } from '../store/ui.store';
import { Theme } from '../types/enums';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for stores to hydrate from localStorage
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    // Initialize theme
    const theme = useUIStore.getState().theme;
    if (typeof document !== 'undefined') {
      if (theme === Theme.AUTO) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      } else {
        document.documentElement.classList.toggle('dark', theme === Theme.DARK);
      }
    }

    // Check online status
    useSyncStore.getState().setOnline(navigator.onLine);

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch initial data when authenticated
  useEffect(() => {
    if (!isHydrated) return;

    const { isAuthenticated } = useAuthStore.getState();
    
    if (isAuthenticated) {
      // Fetch initial data in parallel
      Promise.all([
        useSuitesStore.getState().fetchAllSuites(),
        useTasksStore.getState().fetchAllTasks(),
        useEmployeesStore.getState().fetchAllEmployees(),
        useNotesStore.getState().fetchAllNotes(),
        useNotificationsStore.getState().fetchNotifications(),
      ]).catch((error) => {
        console.error('Failed to fetch initial data:', error);
      });
    }
  }, [isHydrated]);

  // Show loading state while hydrating (optional)
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}


/**
 * UI Store
 * Manages UI state: navigation, modals, theme, toasts
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { UIStore, Toast } from '../types/state';
import { ViewType, Theme, TasksViewDensity, ToastType } from '../types/enums';
import { defaultStorage } from './middleware/persist-storage';

const initialState = {
  currentView: ViewType.DASHBOARD,
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  modalData: null,
  isMobileView: false,
  bottomSheetOpen: false,
  theme: Theme.AUTO,
  suitesGridColumns: 3,
  tasksViewDensity: TasksViewDensity.COMFORTABLE,
  toasts: [],
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setCurrentView: (view: ViewType) => {
          set((state) => {
            state.currentView = view;
          });
        },

        toggleSidebar: () => {
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          });
        },

        setSidebarCollapsed: (collapsed: boolean) => {
          set((state) => {
            state.sidebarCollapsed = collapsed;
          });
        },

        openModal: (modalName: string, data?: Record<string, unknown>) => {
          set((state) => {
            state.activeModal = modalName;
            state.modalData = data || null;
          });
        },

        closeModal: () => {
          set((state) => {
            state.activeModal = null;
            state.modalData = null;
          });
        },

        setMobileView: (isMobile: boolean) => {
          set((state) => {
            state.isMobileView = isMobile;
            // Auto-close sidebar on mobile
            if (isMobile && state.sidebarOpen) {
              state.sidebarOpen = false;
            }
          });
        },

        toggleBottomSheet: () => {
          set((state) => {
            state.bottomSheetOpen = !state.bottomSheetOpen;
          });
        },

        setTheme: (theme: Theme) => {
          set((state) => {
            state.theme = theme;
          });

          // Apply theme to DOM
          if (typeof document !== 'undefined') {
            const root = document.documentElement;
            
            if (theme === Theme.AUTO) {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              root.classList.toggle('dark', prefersDark);
            } else {
              root.classList.toggle('dark', theme === Theme.DARK);
            }
          }
        },

        updateLayoutPreference: (key: string, value: unknown) => {
          set((state) => {
            if (key === 'suitesGridColumns' && typeof value === 'number') {
              state.suitesGridColumns = value;
            } else if (key === 'tasksViewDensity' && typeof value === 'string') {
              state.tasksViewDensity = value as TasksViewDensity;
            }
          });
        },

        showToast: (toast: Omit<Toast, 'id'>) => {
          const toastWithId: Toast = {
            id: uuidv4(),
            type: toast.type,
            message: toast.message,
            duration: toast.duration || 3000,
          };

          set((state) => {
            state.toasts.push(toastWithId);
          });

          // Auto-remove after duration
          setTimeout(() => {
            set((state) => {
              state.toasts = state.toasts.filter((t) => t.id !== toastWithId.id);
            });
          }, toastWithId.duration);
        },

        removeToast: (toastId: string) => {
          set((state) => {
            state.toasts = state.toasts.filter((t) => t.id !== toastId);
          });
        },
      })),
      {
        name: 'ui-store',
        storage: defaultStorage,
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          suitesGridColumns: state.suitesGridColumns,
          tasksViewDensity: state.tasksViewDensity,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const storedState = localStorage.getItem('motel_ui-store');
  if (storedState) {
    try {
      const parsed = JSON.parse(storedState);
      const theme = parsed.state?.theme || Theme.AUTO;
      useUIStore.getState().setTheme(theme);
    } catch {
      // Ignore parse errors
    }
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useUIStore.getState();
    if (theme === Theme.AUTO) {
      useUIStore.getState().setTheme(Theme.AUTO);
    }
  });
}


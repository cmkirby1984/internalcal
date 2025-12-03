/**
 * Permission Middleware for Zustand
 * Enforces permission checks before certain actions
 */

import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { useAuthStore } from '../auth.store';

// Map of action types to required permissions
export const ACTION_PERMISSIONS: Record<string, string> = {
  // Suites
  createSuite: 'create_suite',
  deleteSuite: 'delete_suite',
  updateSuiteStatus: 'update_suite_status',

  // Tasks
  createTask: 'create_task',
  deleteTask: 'delete_task',
  assignTask: 'assign_tasks',

  // Employees
  createEmployee: 'manage_employees',
  deleteEmployee: 'manage_employees',
  updateEmployee: 'manage_employees',

  // Notes
  deleteNote: 'delete_notes',

  // Notifications
  deleteNotification: 'manage_notifications',
};

/**
 * Check if current user has permission
 */
export const hasPermission = (permission: string): boolean => {
  return useAuthStore.getState().checkPermission(permission);
};

/**
 * Check multiple permissions (AND logic)
 */
export const hasAllPermissions = (permissions: string[]): boolean => {
  return permissions.every((p) => hasPermission(p));
};

/**
 * Check multiple permissions (OR logic)
 */
export const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some((p) => hasPermission(p));
};

/**
 * Decorator to wrap actions with permission checks
 */
export const withPermission = <T extends (...args: unknown[]) => unknown>(
  permission: string,
  action: T,
  errorMessage: string = 'Insufficient permissions'
): T => {
  return ((...args: Parameters<T>) => {
    if (!hasPermission(permission)) {
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    return action(...args);
  }) as T;
};

type PermissionMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  actionPermissionMap?: Record<string, string>
) => StateCreator<T, Mps, Mcs>;

type PermissionMiddlewareImpl = <T>(
  f: StateCreator<T, [], []>,
  actionPermissionMap?: Record<string, string>
) => StateCreator<T, [], []>;

/**
 * Permission middleware that wraps store actions
 * Note: This is a simplified version - in production you'd want more sophisticated action detection
 */
const permissionMiddlewareImpl: PermissionMiddlewareImpl = (f, actionPermissionMap = ACTION_PERMISSIONS) => (set, get, store) => {
  const wrappedStore = {
    ...store,
    // Could intercept getState to check permissions on actions
  };

  return f(set, get, wrappedStore);
};

export const permissionMiddleware = permissionMiddlewareImpl as PermissionMiddleware;

/**
 * Hook to check if user can perform an action
 */
export const useCanPerformAction = (action: string): boolean => {
  const permission = ACTION_PERMISSIONS[action];
  if (!permission) return true; // No permission required

  return useAuthStore((state) => {
    const { permissions } = state;
    return permissions.includes(permission) || permissions.includes('*');
  });
};

/**
 * Get all available permissions for current user
 */
export const useUserPermissions = (): string[] => {
  return useAuthStore((state) => state.permissions);
};

/**
 * Check if user has admin/manager role
 */
export const useIsAdmin = (): boolean => {
  return useAuthStore((state) => {
    const { currentUser } = state;
    if (!currentUser) return false;
    return ['ADMIN', 'MANAGER'].includes(currentUser.role);
  });
};

/**
 * Check if user is supervisor or above
 */
export const useIsSupervisor = (): boolean => {
  return useAuthStore((state) => {
    const { currentUser } = state;
    if (!currentUser) return false;
    return ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(currentUser.role);
  });
};


// Re-export all middleware
export { logger } from './logger';
export { defaultStorage, createStorage, clearPersistedState, clearAllPersistedState } from './persist-storage';
export {
  permissionMiddleware,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  withPermission,
  useCanPerformAction,
  useUserPermissions,
  useIsAdmin,
  useIsSupervisor,
  ACTION_PERMISSIONS,
} from './permissions';


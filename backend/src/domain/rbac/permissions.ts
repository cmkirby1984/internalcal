/**
 * Permission definitions matching the pseudo-code permission matrix
 */

export enum Permission {
  // Task permissions
  VIEW_ASSIGNED_TASKS = 'view_assigned_tasks',
  VIEW_ALL_TASKS = 'view_all_tasks',
  UPDATE_TASK_STATUS = 'update_task_status',
  ADD_TASKS = 'add_tasks',
  ASSIGN_TASKS = 'assign_tasks',
  DELETE_TASKS = 'delete_tasks',

  // Suite permissions
  VIEW_ALL_SUITES = 'view_all_suites',
  UPDATE_SUITE_STATUS = 'update_suite_status',
  CREATE_SUITES = 'create_suites',
  DELETE_SUITES = 'delete_suites',

  // Employee permissions
  VIEW_EMPLOYEES = 'view_employees',
  MANAGE_EMPLOYEES = 'manage_employees',

  // Note permissions
  ADD_NOTES = 'add_notes',
  ADD_MAINTENANCE_NOTES = 'add_maintenance_notes',
  VIEW_ALL_NOTES = 'view_all_notes',
  DELETE_NOTES = 'delete_notes',

  // Admin permissions
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_REPORTS = 'view_reports',
  WILDCARD = '*',
}

/**
 * Role-based default permissions
 */
export const RolePermissions: Record<string, Permission[]> = {
  HOUSEKEEPER: [
    Permission.VIEW_ASSIGNED_TASKS,
    Permission.UPDATE_TASK_STATUS,
    Permission.ADD_NOTES,
  ],

  MAINTENANCE: [
    Permission.VIEW_ASSIGNED_TASKS,
    Permission.UPDATE_TASK_STATUS,
    Permission.ADD_MAINTENANCE_NOTES,
    Permission.UPDATE_SUITE_STATUS,
  ],

  FRONT_DESK: [
    Permission.VIEW_ALL_SUITES,
    Permission.UPDATE_SUITE_STATUS,
    Permission.VIEW_ALL_TASKS,
    Permission.ADD_NOTES,
  ],

  SUPERVISOR: [
    Permission.VIEW_ALL_TASKS,
    Permission.ASSIGN_TASKS,
    Permission.ADD_TASKS,
    Permission.VIEW_ALL_SUITES,
    Permission.UPDATE_SUITE_STATUS,
    Permission.VIEW_EMPLOYEES,
    Permission.ADD_NOTES,
    Permission.VIEW_ALL_NOTES,
  ],

  MANAGER: [Permission.WILDCARD],

  ADMIN: [Permission.WILDCARD],
};

/**
 * Check if a permission list includes a required permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: Permission | string,
): boolean {
  // Wildcard grants all permissions
  if (userPermissions.includes(Permission.WILDCARD)) {
    return true;
  }

  return userPermissions.includes(requiredPermission);
}

/**
 * Check if a permission list includes any of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: (Permission | string)[],
): boolean {
  if (userPermissions.includes(Permission.WILDCARD)) {
    return true;
  }

  return requiredPermissions.some((p) => userPermissions.includes(p));
}

/**
 * Check if a permission list includes all of the required permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: (Permission | string)[],
): boolean {
  if (userPermissions.includes(Permission.WILDCARD)) {
    return true;
  }

  return requiredPermissions.every((p) => userPermissions.includes(p));
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: string): string[] {
  return RolePermissions[role]?.map(String) || [];
}

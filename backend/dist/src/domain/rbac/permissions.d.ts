export declare enum Permission {
    VIEW_ASSIGNED_TASKS = "view_assigned_tasks",
    VIEW_ALL_TASKS = "view_all_tasks",
    UPDATE_TASK_STATUS = "update_task_status",
    ADD_TASKS = "add_tasks",
    ASSIGN_TASKS = "assign_tasks",
    DELETE_TASKS = "delete_tasks",
    VIEW_ALL_SUITES = "view_all_suites",
    UPDATE_SUITE_STATUS = "update_suite_status",
    CREATE_SUITES = "create_suites",
    DELETE_SUITES = "delete_suites",
    VIEW_EMPLOYEES = "view_employees",
    MANAGE_EMPLOYEES = "manage_employees",
    ADD_NOTES = "add_notes",
    ADD_MAINTENANCE_NOTES = "add_maintenance_notes",
    VIEW_ALL_NOTES = "view_all_notes",
    DELETE_NOTES = "delete_notes",
    MANAGE_SETTINGS = "manage_settings",
    VIEW_REPORTS = "view_reports",
    WILDCARD = "*"
}
export declare const RolePermissions: Record<string, Permission[]>;
export declare function hasPermission(userPermissions: string[], requiredPermission: Permission | string): boolean;
export declare function hasAnyPermission(userPermissions: string[], requiredPermissions: (Permission | string)[]): boolean;
export declare function hasAllPermissions(userPermissions: string[], requiredPermissions: (Permission | string)[]): boolean;
export declare function getDefaultPermissions(role: string): string[];

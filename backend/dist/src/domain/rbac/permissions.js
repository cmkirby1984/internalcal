"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissions = exports.Permission = void 0;
exports.hasPermission = hasPermission;
exports.hasAnyPermission = hasAnyPermission;
exports.hasAllPermissions = hasAllPermissions;
exports.getDefaultPermissions = getDefaultPermissions;
var Permission;
(function (Permission) {
    Permission["VIEW_ASSIGNED_TASKS"] = "view_assigned_tasks";
    Permission["VIEW_ALL_TASKS"] = "view_all_tasks";
    Permission["UPDATE_TASK_STATUS"] = "update_task_status";
    Permission["ADD_TASKS"] = "add_tasks";
    Permission["ASSIGN_TASKS"] = "assign_tasks";
    Permission["DELETE_TASKS"] = "delete_tasks";
    Permission["VIEW_ALL_SUITES"] = "view_all_suites";
    Permission["UPDATE_SUITE_STATUS"] = "update_suite_status";
    Permission["CREATE_SUITES"] = "create_suites";
    Permission["DELETE_SUITES"] = "delete_suites";
    Permission["VIEW_EMPLOYEES"] = "view_employees";
    Permission["MANAGE_EMPLOYEES"] = "manage_employees";
    Permission["ADD_NOTES"] = "add_notes";
    Permission["ADD_MAINTENANCE_NOTES"] = "add_maintenance_notes";
    Permission["VIEW_ALL_NOTES"] = "view_all_notes";
    Permission["DELETE_NOTES"] = "delete_notes";
    Permission["MANAGE_SETTINGS"] = "manage_settings";
    Permission["VIEW_REPORTS"] = "view_reports";
    Permission["WILDCARD"] = "*";
})(Permission || (exports.Permission = Permission = {}));
exports.RolePermissions = {
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
function hasPermission(userPermissions, requiredPermission) {
    if (userPermissions.includes(Permission.WILDCARD)) {
        return true;
    }
    return userPermissions.includes(requiredPermission);
}
function hasAnyPermission(userPermissions, requiredPermissions) {
    if (userPermissions.includes(Permission.WILDCARD)) {
        return true;
    }
    return requiredPermissions.some((p) => userPermissions.includes(p));
}
function hasAllPermissions(userPermissions, requiredPermissions) {
    if (userPermissions.includes(Permission.WILDCARD)) {
        return true;
    }
    return requiredPermissions.every((p) => userPermissions.includes(p));
}
function getDefaultPermissions(role) {
    return exports.RolePermissions[role]?.map(String) || [];
}
//# sourceMappingURL=permissions.js.map
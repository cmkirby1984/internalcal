/**
 * Employees Selectors
 * Computed/derived state for employees
 */

import { useEmployeesStore } from '../employees.store';
import type { Employee } from '../../types/entities';
import { EmployeeRole, Department, EmployeeStatus } from '../../types/enums';

/**
 * Get all employees as an array
 */
export const useAllEmployees = (): Employee[] => {
  return useEmployeesStore((state) =>
    state.allIds.map((id) => state.items[id]).filter(Boolean)
  );
};

/**
 * Get filtered employees based on current filters
 */
export const useFilteredEmployees = (): Employee[] => {
  return useEmployeesStore((state) => {
    const { items, allIds, filters } = state;

    let filtered = allIds.map((id) => items[id]).filter(Boolean);

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((employee) => filters.status!.includes(employee.status));
    }

    // Apply role filter
    if (filters.role && filters.role.length > 0) {
      filtered = filtered.filter((employee) => filters.role!.includes(employee.role));
    }

    // Apply department filter
    if (filters.department && filters.department.length > 0) {
      filtered = filtered.filter((employee) =>
        filters.department!.includes(employee.department)
      );
    }

    return filtered;
  });
};

/**
 * Get on-duty employees
 */
export const useOnDutyEmployees = (): Employee[] => {
  return useEmployeesStore((state) =>
    state.onDuty.map((id) => state.items[id]).filter(Boolean)
  );
};

/**
 * Get available employees (on duty with no active tasks)
 */
export const useAvailableEmployees = (): Employee[] => {
  return useEmployeesStore((state) =>
    state.available.map((id) => state.items[id]).filter(Boolean)
  );
};

/**
 * Get employees by role
 */
export const useEmployeesByRole = (role: EmployeeRole): Employee[] => {
  return useEmployeesStore((state) => {
    const employeeIds = state.byRole[role] || [];
    return employeeIds.map((id) => state.items[id]).filter(Boolean);
  });
};

/**
 * Get employees by department
 */
export const useEmployeesByDepartment = (department: Department): Employee[] => {
  return useEmployeesStore((state) => {
    const employeeIds = state.byDepartment[department] || [];
    return employeeIds.map((id) => state.items[id]).filter(Boolean);
  });
};

/**
 * Get housekeepers
 */
export const useHousekeepers = (): Employee[] => {
  return useEmployeesByRole(EmployeeRole.HOUSEKEEPER);
};

/**
 * Get maintenance staff
 */
export const useMaintenanceStaff = (): Employee[] => {
  return useEmployeesByRole(EmployeeRole.MAINTENANCE);
};

/**
 * Get supervisors
 */
export const useSupervisors = (): Employee[] => {
  return useEmployeesStore((state) => {
    const supervisorRoles = [EmployeeRole.SUPERVISOR, EmployeeRole.MANAGER, EmployeeRole.ADMIN];
    
    return state.allIds
      .map((id) => state.items[id])
      .filter((employee) => employee && supervisorRoles.includes(employee.role));
  });
};

/**
 * Get selected employee
 */
export const useSelectedEmployee = (): Employee | null => {
  return useEmployeesStore((state) =>
    state.selectedEmployeeId ? state.items[state.selectedEmployeeId] : null
  );
};

/**
 * Get employee by ID
 */
export const useEmployeeById = (employeeId: string | null): Employee | null => {
  return useEmployeesStore((state) => (employeeId ? state.items[employeeId] : null));
};

/**
 * Get employee full name
 */
export const useEmployeeFullName = (employeeId: string | null): string => {
  return useEmployeesStore((state) => {
    if (!employeeId) return '';
    const employee = state.items[employeeId];
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  });
};

/**
 * Get employees grouped by department
 */
export const useEmployeesGroupedByDepartment = (): Record<Department, Employee[]> => {
  return useEmployeesStore((state) => {
    const byDepartment = {} as Record<Department, Employee[]>;

    Object.values(Department).forEach((dept) => {
      const employeeIds = state.byDepartment[dept] || [];
      byDepartment[dept] = employeeIds.map((id) => state.items[id]).filter(Boolean);
    });

    return byDepartment;
  });
};

/**
 * Get employees grouped by role
 */
export const useEmployeesGroupedByRole = (): Record<EmployeeRole, Employee[]> => {
  return useEmployeesStore((state) => {
    const byRole = {} as Record<EmployeeRole, Employee[]>;

    Object.values(EmployeeRole).forEach((role) => {
      const employeeIds = state.byRole[role] || [];
      byRole[role] = employeeIds.map((id) => state.items[id]).filter(Boolean);
    });

    return byRole;
  });
};

/**
 * Get employee status counts
 */
export const useEmployeeStatusCounts = (): Record<EmployeeStatus, number> => {
  return useEmployeesStore((state) => {
    const counts = {} as Record<EmployeeStatus, number>;

    Object.values(EmployeeStatus).forEach((status) => {
      counts[status] = 0;
    });

    state.allIds.forEach((id) => {
      const employee = state.items[id];
      if (employee) {
        counts[employee.status]++;
      }
    });

    return counts;
  });
};

/**
 * Get employee role counts
 */
export const useEmployeeRoleCounts = (): Record<EmployeeRole, number> => {
  return useEmployeesStore((state) => {
    const counts = {} as Record<EmployeeRole, number>;

    Object.values(EmployeeRole).forEach((role) => {
      counts[role] = state.byRole[role]?.length || 0;
    });

    return counts;
  });
};

/**
 * Search employees by name
 */
export const useSearchEmployees = (query: string): Employee[] => {
  return useEmployeesStore((state) => {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();

    return state.allIds
      .map((id) => state.items[id])
      .filter((employee) => {
        if (!employee) return false;
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        return (
          fullName.includes(lowerQuery) ||
          employee.email.toLowerCase().includes(lowerQuery) ||
          employee.employeeNumber.toLowerCase().includes(lowerQuery)
        );
      });
  });
};


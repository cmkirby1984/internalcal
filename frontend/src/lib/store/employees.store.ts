/**
 * Employees Store
 * Manages employee state with groupings by role, department, and duty status
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { EmployeesStore, EmployeeFilters } from '../types/state';
import type { Employee } from '../types/entities';
import { Department, EmployeeRole, EmployeeStatus, TaskStatus } from '../types/enums';
import { employeesApi } from '../api/endpoints';
import { useUIStore } from './ui.store';
import { useTasksStore } from './tasks.store';

const initialFilters: EmployeeFilters = {
  status: null,
  role: null,
  department: null,
};

const initialState = {
  items: {},
  allIds: [],
  onDuty: [],
  available: [],
  byDepartment: {} as Record<Department, string[]>,
  byRole: {} as Record<EmployeeRole, string[]>,
  filters: initialFilters,
  selectedEmployeeId: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const useEmployeesStore = create<EmployeesStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ───────────────────────────────────────────────────────────────────────
      // FETCH OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      fetchAllEmployees: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const employees = await employeesApi.getAll();
          get().normalizeEmployees(employees);
          get().updateEmployeeGroupings();

          set((state) => {
            state.lastFetched = new Date().toISOString();
            state.isLoading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = (error as Error).message || 'Failed to load employees';
            state.isLoading = false;
          });
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to load employees',
            duration: 5000,
          });
        }
      },

      fetchEmployeeById: async (employeeId: string) => {
        try {
          const employee = await employeesApi.getById(employeeId);
          get().updateEmployeeLocal(employeeId, employee);
          get().updateEmployeeGroupings();
        } catch {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to load employee',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // CRUD OPERATIONS
      // ───────────────────────────────────────────────────────────────────────

      createEmployee: async (employeeData: Partial<Employee>) => {
        try {
          const newEmployee = await employeesApi.create(employeeData);
          get().addEmployee(newEmployee);
          get().updateEmployeeGroupings();

          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Employee created',
            duration: 3000,
          });

          return newEmployee;
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: (error as Error).message || 'Failed to create employee',
            duration: 5000,
          });
          throw error;
        }
      },

      updateEmployee: async (employeeId: string, updates: Partial<Employee>) => {
        const originalEmployee = get().items[employeeId];
        get().updateEmployeeLocal(employeeId, updates);

        try {
          const updatedEmployee = await employeesApi.update(employeeId, updates);
          get().updateEmployeeLocal(employeeId, updatedEmployee);
          get().updateEmployeeGroupings();
        } catch (error) {
          // Rollback on error
          if (originalEmployee) {
            get().updateEmployeeLocal(employeeId, originalEmployee);
          }
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to update employee',
            duration: 5000,
          });
        }
      },

      deleteEmployee: async (employeeId: string) => {
        try {
          await employeesApi.delete(employeeId);
          get().removeEmployee(employeeId);
          get().updateEmployeeGroupings();

          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Employee deleted',
            duration: 3000,
          });
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to delete employee',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // CLOCK IN/OUT
      // ───────────────────────────────────────────────────────────────────────

      clockIn: async (employeeId: string) => {
        try {
          const updatedEmployee = await employeesApi.clockIn(employeeId);
          get().updateEmployeeLocal(employeeId, updatedEmployee);
          get().updateEmployeeGroupings();

          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Clocked in successfully',
            duration: 3000,
          });
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to clock in',
            duration: 5000,
          });
        }
      },

      clockOut: async (employeeId: string) => {
        // Check for active tasks
        const tasksState = useTasksStore.getState();
        const employeeTasks = tasksState.byEmployee[employeeId] || [];
        const activeTasks = employeeTasks.filter((taskId) => {
          const task = tasksState.items[taskId];
          return task && [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS].includes(task.status);
        });

        if (activeTasks.length > 0) {
          // In a real app, this would trigger a confirmation dialog
          console.warn('Employee has active tasks');
        }

        try {
          const updatedEmployee = await employeesApi.clockOut(employeeId);
          get().updateEmployeeLocal(employeeId, updatedEmployee);
          get().updateEmployeeGroupings();

          useUIStore.getState().showToast({
            type: 'SUCCESS',
            message: 'Clocked out successfully',
            duration: 3000,
          });
        } catch (error) {
          useUIStore.getState().showToast({
            type: 'ERROR',
            message: 'Failed to clock out',
            duration: 5000,
          });
        }
      },

      // ───────────────────────────────────────────────────────────────────────
      // LOCAL STATE UPDATES
      // ───────────────────────────────────────────────────────────────────────

      normalizeEmployees: (employees: Employee[]) => {
        set((state) => {
          employees.forEach((employee) => {
            state.items[employee.id] = employee;
            if (!state.allIds.includes(employee.id)) {
              state.allIds.push(employee.id);
            }
          });
        });
      },

      addEmployee: (employee: Employee) => {
        set((state) => {
          state.items[employee.id] = employee;
          if (!state.allIds.includes(employee.id)) {
            state.allIds.push(employee.id);
          }
        });
      },

      updateEmployeeLocal: (employeeId: string, updates: Partial<Employee>) => {
        set((state) => {
          if (state.items[employeeId]) {
            state.items[employeeId] = {
              ...state.items[employeeId],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
        });
      },

      removeEmployee: (employeeId: string) => {
        set((state) => {
          delete state.items[employeeId];
          state.allIds = state.allIds.filter((id) => id !== employeeId);

          if (state.selectedEmployeeId === employeeId) {
            state.selectedEmployeeId = null;
          }
        });
      },

      updateEmployeeGroupings: () => {
        const tasksState = useTasksStore.getState();

        set((state) => {
          // Clear existing groupings
          state.onDuty = [];
          state.available = [];
          state.byDepartment = {} as Record<Department, string[]>;
          state.byRole = {} as Record<EmployeeRole, string[]>;

          // Rebuild groupings
          state.allIds.forEach((employeeId) => {
            const employee = state.items[employeeId];
            if (!employee) return;

            // On duty employees
            if (employee.isOnDuty) {
              state.onDuty.push(employeeId);

              // Check if available (no active tasks)
              const employeeTasks = tasksState.byEmployee[employeeId] || [];
              const hasActiveTask = employeeTasks.some((taskId) => {
                const task = tasksState.items[taskId];
                return task && [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS].includes(task.status);
              });

              if (!hasActiveTask) {
                state.available.push(employeeId);
              }
            }

            // Group by department
            if (!state.byDepartment[employee.department]) {
              state.byDepartment[employee.department] = [];
            }
            state.byDepartment[employee.department].push(employeeId);

            // Group by role
            if (!state.byRole[employee.role]) {
              state.byRole[employee.role] = [];
            }
            state.byRole[employee.role].push(employeeId);
          });
        });
      },

      // ───────────────────────────────────────────────────────────────────────
      // FILTERING
      // ───────────────────────────────────────────────────────────────────────

      setEmployeeFilters: (filters: Partial<EmployeeFilters>) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      clearEmployeeFilters: () => {
        set((state) => {
          state.filters = initialFilters;
        });
      },

      selectEmployee: (employeeId: string | null) => {
        set((state) => {
          state.selectedEmployeeId = employeeId;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    { name: 'EmployeesStore' }
  )
);


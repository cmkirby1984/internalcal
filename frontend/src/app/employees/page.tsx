'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Select } from '@/components/ui';
import { EmployeeGrid } from '@/components/employees';
import { useEmployeesStore, useUIStore } from '@/lib/store';
import { UIEmployee, EmployeeRole, EmployeeStatus } from '@/lib/types';
import { formatEnumValue } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   EMPLOYEES PAGE
   ───────────────────────────────────────────────────────────────────────────── */

export default function EmployeesPage() {
  const router = useRouter();
  const openModal = useUIStore((state) => state.openModal);
  
  // Store state
  const employeesMap = useEmployeesStore((state) => state.items);
  const isLoading = useEmployeesStore((state) => state.isLoading);
  const fetchAllEmployees = useEmployeesStore((state) => state.fetchAllEmployees);

  // Local state
  const [filters, setFilters] = useState<{
    role?: EmployeeRole;
    status?: EmployeeStatus;
    onDuty?: boolean;
  }>({});

  // Fetch data on mount
  useEffect(() => {
    fetchAllEmployees();
  }, [fetchAllEmployees]);

  // Convert map to array
  const employees = useMemo(() => {
    return Object.values(employeesMap).map(emp => ({
      ...emp,
      fullName: `${emp.firstName} ${emp.lastName}`,
      activeTasks: [],
      permissions: emp.permissions || [],
    })) as UIEmployee[];
  }, [employeesMap]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      if (filters.role && employee.role !== filters.role) return false;
      if (filters.status && employee.status !== filters.status) return false;
      if (filters.onDuty !== undefined && employee.isOnDuty !== filters.onDuty) return false;
      return true;
    });
  }, [employees, filters]);

  // Stats
  const stats = useMemo(() => ({
    total: employees.length,
    onDuty: employees.filter(e => e.isOnDuty).length,
    onBreak: employees.filter(e => e.status === EmployeeStatus.ON_BREAK).length,
    offDuty: employees.filter(e => !e.isOnDuty).length,
  }), [employees]);

  const handleEmployeeClick = (employee: UIEmployee) => {
    router.push(`/employees/${employee.id}`);
  };

  const handleCreateEmployee = () => {
    openModal('create-employee');
  };

  const roleOptions = Object.values(EmployeeRole).map(role => ({
    value: role,
    label: formatEnumValue(role),
  }));

  const statusOptions = Object.values(EmployeeStatus).map(status => ({
    value: status,
    label: formatEnumValue(status),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Employees</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>

        <Button
          onClick={handleCreateEmployee}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setFilters({})}
          className="bg-[var(--bg-card)] rounded-xl p-4 shadow-[var(--shadow-card)] cursor-pointer hover:shadow-[var(--shadow-card-hover)] transition-all"
        >
          <p className="text-sm text-[var(--text-secondary)]">Total</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
        </div>
        <div
          onClick={() => setFilters({ onDuty: true })}
          className="bg-[var(--bg-card)] rounded-xl p-4 shadow-[var(--shadow-card)] cursor-pointer hover:shadow-[var(--shadow-card-hover)] transition-all border-l-4 border-l-emerald-500"
        >
          <p className="text-sm text-[var(--text-secondary)]">On Duty</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.onDuty}</p>
        </div>
        <div
          onClick={() => setFilters({ status: EmployeeStatus.ON_BREAK })}
          className="bg-[var(--bg-card)] rounded-xl p-4 shadow-[var(--shadow-card)] cursor-pointer hover:shadow-[var(--shadow-card-hover)] transition-all border-l-4 border-l-amber-500"
        >
          <p className="text-sm text-[var(--text-secondary)]">On Break</p>
          <p className="text-2xl font-bold text-amber-600">{stats.onBreak}</p>
        </div>
        <div
          onClick={() => setFilters({ onDuty: false })}
          className="bg-[var(--bg-card)] rounded-xl p-4 shadow-[var(--shadow-card)] cursor-pointer hover:shadow-[var(--shadow-card-hover)] transition-all border-l-4 border-l-gray-400"
        >
          <p className="text-sm text-[var(--text-secondary)]">Off Duty</p>
          <p className="text-2xl font-bold text-gray-600">{stats.offDuty}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-44">
          <Select
            placeholder="All Roles"
            options={roleOptions}
            value={filters.role || ''}
            onChange={(value) => setFilters(prev => ({ ...prev, role: value as EmployeeRole || undefined }))}
          />
        </div>
        <div className="w-44">
          <Select
            placeholder="All Statuses"
            options={statusOptions}
            value={filters.status || ''}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value as EmployeeStatus || undefined }))}
          />
        </div>
        
        {(filters.role || filters.status || filters.onDuty !== undefined) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Quick Role Filters */}
      <div className="flex flex-wrap gap-2">
        {Object.values(EmployeeRole).map((role) => {
          const count = employees.filter(e => e.role === role).length;
          const isActive = filters.role === role;
          
          return (
            <button
              key={role}
              onClick={() => setFilters(prev => ({ ...prev, role: isActive ? undefined : role }))}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--primary-600)] text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-light)]'
              }`}
            >
              {formatEnumValue(role)} ({count})
            </button>
          );
        })}
      </div>

      {/* Employees Grid */}
      <EmployeeGrid
        employees={filteredEmployees}
        isLoading={isLoading}
        onEmployeeClick={handleEmployeeClick}
        onCreateEmployee={handleCreateEmployee}
      />
    </div>
  );
}

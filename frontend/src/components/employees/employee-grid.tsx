'use client';

import { cn } from '@/lib/utils';
import { UIEmployee } from '@/lib/types';
import { EmployeeCard } from './employee-card';
import { NoEmployeesFound, SkeletonCard } from '@/components/ui';

interface EmployeeGridProps {
  employees: UIEmployee[];
  isLoading?: boolean;
  onEmployeeClick?: (employee: UIEmployee) => void;
  onCreateEmployee?: () => void;
  className?: string;
}

export function EmployeeGrid({
  employees,
  isLoading = false,
  onEmployeeClick,
  onCreateEmployee,
  className,
}: EmployeeGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--bg-card)] rounded-xl p-12 shadow-[var(--shadow-card)]">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Please Wait
            </h2>
            <p className="text-[var(--text-secondary)]">
              Loading employees...
            </p>
          </div>
        </div>
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return <NoEmployeesFound onCreateEmployee={onCreateEmployee} />;
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onClick={() => onEmployeeClick?.(employee)}
        />
      ))}
    </div>
  );
}


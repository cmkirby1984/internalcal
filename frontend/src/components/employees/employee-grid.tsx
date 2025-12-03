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
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
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


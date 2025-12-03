'use client';

import { cn, formatRelativeTime } from '@/lib/utils';
import { Card, Avatar, EmployeeStatusBadge, Badge } from '@/components/ui';
import { UIEmployee, EmployeeRole, EmployeeStatus } from '@/lib/types';

interface EmployeeCardProps {
  employee: UIEmployee;
  onClick?: () => void;
  showTasks?: boolean;
  compact?: boolean;
  className?: string;
}

const roleLabels: Record<EmployeeRole, string> = {
  [EmployeeRole.ADMIN]: 'Administrator',
  [EmployeeRole.MANAGER]: 'Manager',
  [EmployeeRole.FRONT_DESK]: 'Front Desk',
  [EmployeeRole.HOUSEKEEPER]: 'Housekeeper',
  [EmployeeRole.MAINTENANCE]: 'Maintenance',
  [EmployeeRole.SUPERVISOR]: 'Supervisor',
};

export function EmployeeCard({
  employee,
  onClick,
  showTasks = true,
  compact = false,
  className,
}: EmployeeCardProps) {
  const activeTasks = employee.activeTasks?.length || 0;

  return (
    <Card
      hoverable
      onClick={onClick}
      className={cn(className)}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar
          name={employee.fullName}
          src={employee.avatar}
          size={compact ? 'md' : 'lg'}
          status={employee.isOnDuty ? 'online' : 'offline'}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] truncate">
                {employee.fullName}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {roleLabels[employee.role]}
              </p>
            </div>
            <EmployeeStatusBadge status={employee.status} isOnDuty={employee.isOnDuty} />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      {!compact && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{employee.email}</span>
          </div>
          
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{employee.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Active Tasks */}
      {showTasks && (
        <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
          {activeTasks > 0 ? (
            <div className="flex items-center justify-between">
              <Badge variant="info" size="sm">
                {activeTasks} active task{activeTasks > 1 ? 's' : ''}
              </Badge>
              <span className="text-xs text-[var(--text-muted)]">
                View tasks →
              </span>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No active tasks</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--border-light)] text-xs text-[var(--text-muted)]">
        {employee.isOnDuty && employee.lastClockIn ? (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Clocked in {formatRelativeTime(employee.lastClockIn)}
          </span>
        ) : (
          <span>Off duty</span>
        )}
      </div>
    </Card>
  );
}


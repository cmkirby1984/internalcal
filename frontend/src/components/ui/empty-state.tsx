'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 mb-4 text-[var(--text-muted)]">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      
      {description && (
        <p className="text-[var(--text-secondary)] max-w-sm mb-6">{description}</p>
      )}
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PRESET EMPTY STATES
   ───────────────────────────────────────────────────────────────────────────── */

export function NoSuitesFound({ onCreateSuite }: { onCreateSuite?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      }
      title="No suites found"
      description="Try adjusting your filters or add a new suite to get started."
      action={onCreateSuite ? { label: 'Add Suite', onClick: onCreateSuite } : undefined}
    />
  );
}

export function NoTasksFound({ onCreateTask }: { onCreateTask?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      }
      title="No tasks found"
      description="Create a new task to get started."
      action={onCreateTask ? { label: 'Create Task', onClick: onCreateTask } : undefined}
    />
  );
}

export function NoEmployeesFound({ onCreateEmployee }: { onCreateEmployee?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      title="No employees found"
      description="Add employees to start managing your team."
      action={onCreateEmployee ? { label: 'Add Employee', onClick: onCreateEmployee } : undefined}
    />
  );
}

export function NoNotesFound({ onCreateNote }: { onCreateNote?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      }
      title="No notes found"
      description="Create a note to share information with your team."
      action={onCreateNote ? { label: 'Create Note', onClick: onCreateNote } : undefined}
    />
  );
}


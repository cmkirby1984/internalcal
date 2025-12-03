'use client';

import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────────────
   SPINNER
   ───────────────────────────────────────────────────────────────────────────── */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <svg
      className={cn('animate-spin text-[var(--primary-500)]', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOADING STATE
   ───────────────────────────────────────────────────────────────────────────── */

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Spinner size="lg" />
      <p className="mt-4 text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON
   ───────────────────────────────────────────────────────────────────────────── */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--neutral-200)]',
        variants[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON CARD
   ───────────────────────────────────────────────────────────────────────────── */

export function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton className="w-24 mb-2" />
          <Skeleton className="w-16" />
        </div>
      </div>
      <Skeleton className="w-full mb-2" />
      <Skeleton className="w-3/4 mb-2" />
      <Skeleton className="w-1/2" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE LOADER
   ───────────────────────────────────────────────────────────────────────────── */

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[var(--bg-page)] flex items-center justify-center z-50">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-lg font-medium text-[var(--text-primary)]">Loading...</p>
      </div>
    </div>
  );
}


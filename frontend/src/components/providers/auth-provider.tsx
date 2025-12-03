'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

interface AuthProviderProps {
  children: ReactNode;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        // Redirect to login if not authenticated and trying to access protected route
        router.replace('/login');
      } else if (isAuthenticated && isPublicRoute) {
        // Redirect to dashboard if authenticated and trying to access public route
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show nothing while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


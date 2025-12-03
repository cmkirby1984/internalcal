'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ToastContainer } from '@/components/ui';
import { CreateTaskModal, CreateSuiteModal, CreateEmployeeModal, CreateNoteModal } from '@/components/modals';
import { AuthProvider } from '@/components/providers';
import { WebSocketProvider } from '@/lib/realtime';
import { useAuthStore } from '@/lib/store';

interface MainLayoutProps {
  children: ReactNode;
}

// Routes that should not show the main layout (sidebar/header)
const AUTH_ROUTES = ['/login'];

function LayoutContent({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const showMainLayout = isAuthenticated && !isAuthRoute;

  if (!showMainLayout) {
    // Render children without layout for login page
    return (
      <div className="min-h-screen bg-[var(--bg-page)]">
        {children}
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="lg:ml-[var(--sidebar-width)] min-h-screen flex flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Modals */}
      <CreateTaskModal />
      <CreateSuiteModal />
      <CreateEmployeeModal />
      <CreateNoteModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <LayoutContent>{children}</LayoutContent>
      </WebSocketProvider>
    </AuthProvider>
  );
}

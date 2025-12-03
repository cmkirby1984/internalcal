'use client';

import { type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ToastContainer } from '@/components/ui';
import { CreateTaskModal, CreateSuiteModal, CreateEmployeeModal, CreateNoteModal } from '@/components/modals';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
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


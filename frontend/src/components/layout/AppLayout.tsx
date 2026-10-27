import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { TaskModal } from '../tasks/TaskModal';
import { TaskDetailDrawer } from '../tasks/TaskDetailDrawer';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative w-64 h-full bg-[#0F172A] z-10">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav onOpenMore={() => setMobileMenuOpen(true)} />

      {/* Global Modals */}
      <TaskModal />
      <TaskDetailDrawer />
    </div>
  );
};

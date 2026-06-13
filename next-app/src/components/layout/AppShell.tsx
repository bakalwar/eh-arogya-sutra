'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="eh-mock-root eh-layout-root">
      <div className="app">
        <Topbar onMenuClick={() => setSidebarOpen((open) => !open)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="layout">
          <main className="main">{children}</main>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

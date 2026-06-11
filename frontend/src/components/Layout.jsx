import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { clearSession, getRefreshToken } from '../security/tokenManager';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import StagingBanner from './StagingBanner';

export default function Layout() {
  useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  async function logout() {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await client.post('/api/auth/logout', { refreshToken });
      }
    } catch { /* ignore */ }
    clearSession();
    navigate('/login?start=1', { replace: true });
  }

  // Get dynamic page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Clinical Suite';
    if (path.startsWith('/patient')) return 'Patient Records';
    if (path.startsWith('/search')) return 'Smart Search';
    if (path.startsWith('/prescription')) return 'EH Prescription';
    if (path.startsWith('/reports')) return 'Lab Analysis';
    if (path.startsWith('/admin')) return 'Admin Control';
    if (path.startsWith('/profile')) return 'Clinic Profile';
    if (path.startsWith('/payment')) return 'Billing & Plans';
    if (path.startsWith('/referral')) return 'Referral Program';
    if (path.startsWith('/books')) return 'EH Library';
    if (path.startsWith('/videos')) return 'Video Tutorials';
    return 'EH CDSS';
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)] font-body">
      <StagingBanner />
      
      {/* Shared Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        logout={logout} 
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[240px] transition-all duration-300">
        
        {/* Top Navbar */}
        <TopBar 
          onMenuClick={() => setSidebarOpen(true)} 
          title={getPageTitle()} 
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-[80px] lg:pb-0">
          <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
}

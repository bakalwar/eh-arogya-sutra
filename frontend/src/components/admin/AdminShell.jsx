import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, BarChart3, Settings, LogOut } from 'lucide-react';
import { clearSession } from '../../security/tokenManager';
import '../../styles/admin-panel.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/doctors', label: 'Doctors', icon: Users },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/revenue', label: 'Revenue', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings }
];

export default function AdminShell() {
  const navigate = useNavigate();

  function logout() {
    clearSession();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="admin-panel">
      <header className="admin-nav sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a56db]">Admin Panel</p>
            <h1 className="text-lg font-bold text-[#0f172a]">E.H. Arogya Sutra</h1>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-[#1a56db] text-white' : 'text-[#64748b] hover:bg-[#eff6ff] hover:text-[#0f172a]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#64748b] hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

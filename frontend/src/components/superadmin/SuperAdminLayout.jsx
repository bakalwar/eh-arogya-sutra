import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearSession } from '../../security/tokenManager';
import '../../styles/super-admin.css';

const NAV = [
  { to: '/super-admin/overview', icon: '📊', label: 'Overview' },
  { to: '/super-admin/doctors', icon: '👨‍⚕️', label: 'Doctors' },
  { to: '/super-admin/revenue', icon: '💰', label: 'Revenue' },
  { to: '/super-admin/subscriptions', icon: '📋', label: 'Subscriptions' },
  { to: '/super-admin/pricing', icon: '💳', label: 'Pricing' },
  { to: '/super-admin/referrals', icon: '🎁', label: 'Referrals' },
  { to: '/super-admin/medicines', icon: '💊', label: 'Medicines' },
  { to: '/super-admin/books', icon: '📚', label: 'Books' },
  { to: '/super-admin/videos', icon: '🎥', label: 'Videos' },
  { to: '/super-admin/pharmacy', icon: '🏪', label: 'Pharmacy' },
  { to: '/super-admin/security', icon: '🛡️', label: 'Security' },
  { to: '/super-admin/announcements', icon: '📣', label: 'Announcements' },
  { to: '/super-admin/settings', icon: '⚙️', label: 'Settings' }
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();

  function logout() {
    clearSession();
    navigate('/super-admin/login', { replace: true });
  }

  return (
    <div className="sa-root">
      <aside className="sa-sidebar">
        <div className="sa-sidebar-brand">
          <h1>E.H. AROGYA SUTRA</h1>
          <p className="text-[10px] text-white/40 mt-1">MASTER CONTROL</p>
        </div>
        <nav className="sa-nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sa-nav w-full text-left border-t border-white/10 mt-2" onClick={logout}>
          🚪 Logout
        </button>
      </aside>
      <main className="sa-main">
        <Outlet />
      </main>
    </div>
  );
}

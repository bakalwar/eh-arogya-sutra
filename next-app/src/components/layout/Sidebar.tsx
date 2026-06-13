'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isNavActive, NAV_ITEMS, NAV_SECTIONS } from '@/lib/navigation';
import { clearSession } from '@/lib/session/tokenManager';
import { logoutDoctor } from '@/lib/api/auth';
import { useSessionProfile } from '@/lib/session/useSessionProfile';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, initials } = useSessionProfile();

  async function handleLogout() {
    await logoutDoctor();
    clearSession();
    router.push('/login');
  }

  return (
    <>
      <button
        type="button"
        className={`sidebar-overlay${open ? ' show' : ''}`}
        onClick={onClose}
        aria-label="Close menu"
      />

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-doctor">
          <div className="doctor-info">
            <div className="doctor-av" suppressHydrationWarning>
              {initials}
            </div>
            <div>
              <div className="doctor-name" suppressHydrationWarning>
                {name}
              </div>
              <div className="doctor-plan">E.H. Practitioner</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div className="nav-section" key={section.key}>
              <div className="nav-section-title">{section.title}</div>
              {NAV_ITEMS.filter((item) => item.section === section.key).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item${isNavActive(pathname, item.href) ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.sidebarLabel}
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-plan">
          <div className="sp-plan-title">Account</div>
          <div className="sp-plan-name" suppressHydrationWarning>
            {name}
          </div>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', marginTop: 10, fontSize: 12 }}
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

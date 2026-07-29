import Link from 'next/link';
import { DOCTOR_NAV_ITEMS } from '../../config/navigation';

type NavProps = {
  currentPath: string;
};

function isCurrent(currentPath: string, href: string): boolean {
  if (href === '/dashboard') return currentPath === '/dashboard' || currentPath === '/dashboard/';
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function DesktopSidebar({ currentPath }: NavProps) {
  return (
    <nav className="ehas2-sidebar" aria-label="Doctor desktop navigation">
      {DOCTOR_NAV_ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={isCurrent(currentPath, item.href) ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function TabletNavigation({ currentPath }: NavProps) {
  return (
    <nav className="ehas2-tablet-nav" aria-label="Doctor tablet navigation">
      {DOCTOR_NAV_ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={isCurrent(currentPath, item.href) ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Mobile shows a compact primary set; full list remains available on tablet/desktop. */
const MOBILE_PRIMARY = DOCTOR_NAV_ITEMS.filter((item) =>
  ['dashboard', 'new-case', 'patients', 'settings'].includes(item.id),
);

export function MobileBottomNav({ currentPath }: NavProps) {
  return (
    <nav className="ehas2-bottom-nav" aria-label="Doctor mobile navigation">
      {MOBILE_PRIMARY.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={isCurrent(currentPath, item.href) ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

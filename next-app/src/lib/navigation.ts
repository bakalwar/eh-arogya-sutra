import type { NavItem } from './types';

export const NAV_ITEMS: NavItem[] = [
  { href: '/overview', icon: '🏠', label: 'Home', sidebarLabel: 'Overview', section: 'main', bottomNav: true },
  { href: '/symptom-search', icon: '🔍', label: 'Search', sidebarLabel: 'Symptom Search', section: 'main', bottomNav: true },
  { href: '/records', icon: '👥', label: 'Patients', sidebarLabel: 'Records', section: 'main', bottomNav: true },
  { href: '/case-summary', icon: '📄', label: 'Rx', sidebarLabel: 'Case Summary', section: 'main', bottomNav: true },
  { href: '/reports', icon: '🧪', label: 'Reports', sidebarLabel: 'Report Analysis', section: 'main', moreMenu: true },
  { href: '/appointments', icon: '📅', label: 'Appointments', sidebarLabel: 'Appointments', section: 'tools', moreMenu: true },
  { href: '/clinic', icon: '🏥', label: 'Clinic', sidebarLabel: 'Clinic Profile', section: 'tools', moreMenu: true },
  { href: '/payment', icon: '💳', label: 'Payment', sidebarLabel: 'Payment & Referral', section: 'account', moreMenu: true },
  { href: '/admin', icon: '⚙️', label: 'Admin', sidebarLabel: 'Admin Panel', section: 'account', moreMenu: true },
];

export const NAV_SECTIONS = [
  { key: 'main' as const, title: 'Main Menu' },
  { key: 'tools' as const, title: 'Tools' },
  { key: 'account' as const, title: 'Account' },
];

export function getBottomNavItems() {
  return NAV_ITEMS.filter((item) => item.bottomNav);
}

export function getMoreMenuItems() {
  return NAV_ITEMS.filter((item) => item.moreMenu);
}

export function getNavItemForPath(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function isNavActive(pathname: string, href: string) {
  if (href === '/overview') return pathname === '/overview' || pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

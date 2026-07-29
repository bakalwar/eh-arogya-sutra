export const MANAGEMENT_ROUTES = [
  '/management',
  '/management/doctors',
  '/management/verification',
  '/management/subscriptions',
  '/management/payments',
  '/management/earnings',
  '/management/support',
  '/management/feedback',
  '/management/referrals',
  '/management/reports',
  '/management/audit',
] as const;

export type ManagementRoutePath = (typeof MANAGEMENT_ROUTES)[number];

export type ManagementNavItem = {
  id: string;
  label: string;
  href: ManagementRoutePath;
  /** Permission key required in trusted authz context (UX only; backend still mandatory). */
  requiredPermission: string;
};

/** Typed Management navigation — never merge into ordinary Doctor sidebar. */
export const MANAGEMENT_NAV_ITEMS: readonly ManagementNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/management',
    requiredPermission: 'management.shell.access',
  },
  {
    id: 'doctors',
    label: 'Doctors',
    href: '/management/doctors',
    requiredPermission: 'doctor:list',
  },
  {
    id: 'verification',
    label: 'Verification',
    href: '/management/verification',
    requiredPermission: 'doctor:verification_review',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    href: '/management/subscriptions',
    requiredPermission: 'subscription:list',
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/management/payments',
    requiredPermission: 'payment:list',
  },
  {
    id: 'earnings',
    label: 'Earnings',
    href: '/management/earnings',
    requiredPermission: 'earnings:view',
  },
  {
    id: 'support',
    label: 'Support',
    href: '/management/support',
    requiredPermission: 'support_ticket:list',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    href: '/management/feedback',
    requiredPermission: 'feedback:list',
  },
  {
    id: 'referrals',
    label: 'Referrals',
    href: '/management/referrals',
    requiredPermission: 'referral:view',
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/management/reports',
    requiredPermission: 'management_report:view',
  },
  {
    id: 'audit',
    label: 'Audit',
    href: '/management/audit',
    requiredPermission: 'management.audit.view',
  },
] as const;

export function isManagementRoutePath(pathname: string): boolean {
  return (
    pathname === '/management' ||
    MANAGEMENT_ROUTES.some((r) => r !== '/management' && pathname.startsWith(r))
  );
}

export function managementNavExcludesSuperAdminControls(): boolean {
  return !MANAGEMENT_NAV_ITEMS.some(
    (item) =>
      /super.?admin/i.test(item.label) ||
      item.href.includes('/ops') ||
      /security.?center|waf|shell\s*access/i.test(item.label),
  );
}

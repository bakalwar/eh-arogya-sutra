export type DoctorNavItem = {
  id: string;
  label: string;
  href: string;
  comingSoon?: boolean;
  comingPhase?: string;
};

/** Single source of truth for doctor navigation — no Management Admin / Super Admin entries. */
export const DOCTOR_NAV_ITEMS: readonly DoctorNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'new-case', label: 'New Case', href: '/cases/new' },
  { id: 'patients', label: 'Patients', href: '/patients' },
  {
    id: 'reports',
    label: 'Reports',
    href: '/dashboard/coming/reports',
    comingSoon: true,
    comingPhase: 'Phase 2+',
  },
  { id: 'prescriptions', label: 'Prescriptions', href: '/prescriptions' },
  {
    id: 'medicines',
    label: 'Medicines',
    href: '/dashboard/coming/medicines',
    comingSoon: true,
    comingPhase: 'Phase 2+',
  },
  { id: 'feedback', label: 'Feedback & Support', href: '/feedback' },
  {
    id: 'settings',
    label: 'Settings',
    href: '/dashboard/coming/settings',
    comingSoon: true,
    comingPhase: 'Phase 2+',
  },
] as const;

export const PUBLIC_ROUTES = {
  splash: '/',
  login: '/login',
  verifyOtp: '/verify-otp',
  dashboard: '/dashboard',
  feedback: '/feedback',
  uiFoundation: '/ui-foundation',
} as const;

export const QUICK_ACTIONS = [
  {
    id: 'new-case',
    label: 'New Case',
    href: '/cases/new',
    comingPhase: 'Phase 1C-B',
  },
  {
    id: 'patients',
    label: 'Patients',
    href: '/patients',
    comingPhase: 'Phase 1C-B',
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/dashboard/coming/reports',
    comingPhase: 'Phase 2+',
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    href: '/prescriptions',
    comingPhase: 'Phase 1C-C',
  },
  {
    id: 'feedback',
    label: 'Feedback & Support',
    href: '/feedback',
    comingPhase: 'Phase 2A-M',
  },
] as const;

export function isDoctorNavHref(href: string): boolean {
  return DOCTOR_NAV_ITEMS.some((item) => item.href === href);
}

export function doctorNavExcludesSuperAdmin(): boolean {
  return !DOCTOR_NAV_ITEMS.some(
    (item) =>
      /super.?admin/i.test(item.label) ||
      /super.?admin/i.test(item.href) ||
      /security.?center/i.test(item.label) ||
      item.href.includes('/ops'),
  );
}

export function doctorNavExcludesManagementAdmin(): boolean {
  return !DOCTOR_NAV_ITEMS.some(
    (item) =>
      /management\s*admin/i.test(item.label) ||
      item.href === '/management' ||
      item.href.startsWith('/management/'),
  );
}

export function doctorNavIncludesFeedbackAndSupport(): boolean {
  return DOCTOR_NAV_ITEMS.some(
    (item) => item.label === 'Feedback & Support' && item.href === '/feedback',
  );
}

export function isDoctorAreaPath(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/patients') ||
    pathname.startsWith('/cases') ||
    pathname.startsWith('/prescriptions') ||
    pathname.startsWith('/print') ||
    pathname.startsWith('/feedback')
  );
}

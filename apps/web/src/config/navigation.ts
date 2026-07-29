export type DoctorNavItem = {
  id: string;
  label: string;
  href: string;
};

/** Single source of truth for doctor navigation — no Super Admin entries. */
export const DOCTOR_NAV_ITEMS: readonly DoctorNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/app' },
  { id: 'new-case', label: 'New Case', href: '/app/new-case' },
  { id: 'patients', label: 'Patients', href: '/app/patients' },
  { id: 'reports', label: 'Reports', href: '/app/reports' },
  { id: 'prescriptions', label: 'Prescriptions', href: '/app/prescriptions' },
  { id: 'medicines', label: 'Medicines', href: '/app/medicines' },
  { id: 'settings', label: 'Settings', href: '/app/settings' },
] as const;

export const PUBLIC_ROUTES = {
  home: '/',
  uiFoundation: '/ui-foundation',
} as const;

export function isDoctorNavHref(href: string): boolean {
  return DOCTOR_NAV_ITEMS.some((item) => item.href === href);
}

export function doctorNavExcludesSuperAdmin(): boolean {
  return !DOCTOR_NAV_ITEMS.some(
    (item) =>
      /super.?admin/i.test(item.label) ||
      /super.?admin/i.test(item.href) ||
      /security.?center/i.test(item.label),
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { DoctorShell } from '../../../../components/shell/DoctorShell';
import { NotImplementedNotice, PageHeader } from '../../../../components/ui/Primitives';

const TITLES: Record<string, { title: string; phase: string }> = {
  'new-case': { title: 'New Case', phase: 'Phase 1C-B' },
  patients: { title: 'Patients', phase: 'Phase 1C-B' },
  reports: { title: 'Reports', phase: 'Phase 1C-C' },
  prescriptions: { title: 'Prescriptions', phase: 'Phase 1C-C' },
  medicines: { title: 'Medicines', phase: 'Phase 1C-C' },
  settings: { title: 'Settings', phase: 'Phase 1C-B' },
};

export default function ComingSoonPage() {
  const pathname = usePathname() || '/dashboard';
  const section = pathname.split('/').filter(Boolean).pop() ?? '';
  const meta = TITLES[section] ?? { title: 'Coming soon', phase: 'Phase 1C-B/C' };
  return (
    <DoctorShell currentPath={pathname}>
      <PageHeader title={meta.title} description={`Coming in ${meta.phase}`} />
      <NotImplementedNotice feature={`${meta.title} screen`} />
    </DoctorShell>
  );
}

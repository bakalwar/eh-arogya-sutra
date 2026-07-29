'use client';

import { CaseDraftProvider } from '../../context/CaseDraftProvider';
import { DoctorShell } from '../../components/shell/DoctorShell';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function CasesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/cases/new';
  return (
    <CaseDraftProvider>
      <DoctorShell currentPath={pathname}>{children}</DoctorShell>
    </CaseDraftProvider>
  );
}

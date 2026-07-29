'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DoctorShell } from '../../components/shell/DoctorShell';

export default function DoctorAppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/app';
  return <DoctorShell currentPath={pathname}>{children}</DoctorShell>;
}

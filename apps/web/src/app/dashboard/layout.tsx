import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Doctor Dashboard · E.H. AROGYA SUTRA 2',
  description: 'Doctor dashboard UI preview — empty/zero states only.',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}

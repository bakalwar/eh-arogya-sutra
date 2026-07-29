import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NewCasePageClient } from './NewCasePageClient';

export const metadata: Metadata = {
  title: 'New Case · E.H. AROGYA SUTRA 2',
  description: 'New case multi-step UI preview — no clinical engine.',
};

export default function NewCasePage() {
  return (
    <Suspense fallback={<p role="status">Loading new case preview…</p>}>
      <NewCasePageClient />
    </Suspense>
  );
}

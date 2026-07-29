import type { Metadata } from 'next';
import { ManagementPlaceholderPage } from '../../../components/management/ManagementPlaceholderPage';

export const metadata: Metadata = {
  title: 'Management · Verification · E.H. AROGYA SUTRA 2',
  robots: { index: false, follow: false },
};

export default function ManagementPage() {
  return (
    <ManagementPlaceholderPage
      currentPath="/management/verification"
      title="Management · Verification"
      moduleLabel="Verification"
    />
  );
}

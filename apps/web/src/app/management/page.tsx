import type { Metadata } from 'next';
import { ManagementPlaceholderPage } from '../../components/management/ManagementPlaceholderPage';

export const metadata: Metadata = {
  title: 'Management Admin · E.H. AROGYA SUTRA 2',
  robots: { index: false, follow: false },
};

export default function ManagementHomePage() {
  return (
    <ManagementPlaceholderPage
      currentPath="/management"
      title="Management Admin"
      moduleLabel="Management overview"
    />
  );
}

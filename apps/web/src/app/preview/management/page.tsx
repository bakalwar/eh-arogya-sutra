import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocalPreviewAllowed } from '../../../lib/preview/previewGate';
import { ManagementPlaceholderPage } from '../../../components/management/ManagementPlaceholderPage';

export const metadata: Metadata = {
  title: 'Management Admin Preview · E.H. AROGYA SUTRA 2',
  robots: { index: false, follow: false },
};

/**
 * Local preview entry for Management Admin shell.
 * Not linked from DoctorShell. Production /preview is blocked by middleware.
 */
export default function PreviewManagementPage() {
  if (!isLocalPreviewAllowed(process.env)) {
    notFound();
  }
  return (
    <ManagementPlaceholderPage
      currentPath="/preview/management"
      title="Management Admin · local preview"
      moduleLabel="Management (NOT_CONNECTED)"
    />
  );
}

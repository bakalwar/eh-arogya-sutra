import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocalPreviewAllowed } from '../../../lib/preview/previewGate';
import { SuperAdminShell } from '../../../components/shell/AdminPlaceholders';
import { PageHeader, Surface } from '../../../components/ui/Primitives';

export const metadata: Metadata = {
  title: 'Super Admin Preview · E.H. AROGYA SUTRA 2',
  robots: { index: false, follow: false },
};

/**
 * Local preview of Super Admin control-plane foundation status.
 * Separate from DoctorShell and ManagementShell. Not live.
 */
export default function PreviewSuperAdminPage() {
  if (!isLocalPreviewAllowed(process.env)) {
    notFound();
  }
  return (
    <main className="ehas2-preview-super-admin" data-ehas2-super-admin-preview="true">
      <PageHeader
        title="Super Admin foundation status"
        description="Control-plane shell preview — no live Super Admin login, monitoring, or migration controls."
      />
      <Surface>
        <SuperAdminShell />
        <ul>
          <li>Authentication: not live (passkeys PASSKEY_NOT_CONNECTED)</li>
          <li>OTP provider: NOT_CONFIGURED · Phase 4B HOLD</li>
          <li>Monitoring / WAF / incidents: NOT_IMPLEMENTED</li>
          <li>Default patient PHI: none</li>
        </ul>
      </Surface>
    </main>
  );
}

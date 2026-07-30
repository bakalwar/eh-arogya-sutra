import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocalPreviewAllowed } from '../../../lib/preview/previewGate';
import { PageHeader, Surface } from '../../../components/ui/Primitives';

export const metadata: Metadata = {
  title: 'Clinical Integration Status · Preview · EHAS2',
  description: 'Non-clinical Phase 5B status board — no engine calls.',
  robots: { index: false, follow: false },
};

/**
 * Truthful non-clinical status for Phase 5B.
 * Static labels only — no filesystem clinical reads, no engine calls.
 */
const ROWS: ReadonlyArray<{ label: string; status: string }> = [
  { label: 'Disease source audited', status: '116,284' },
  {
    label: 'Sanitized disease package',
    status: 'GENERATED (local artifact path; not installed live)',
  },
  { label: 'Disease package installed live', status: 'NO' },
  { label: 'Canonical medicine registry', status: '39' },
  { label: 'C11 status', status: 'PRESENT' },
  { label: 'Nine-rule interfaces', status: '9 defined' },
  { label: 'Nine-rule orchestration', status: 'NOT_CONNECTED' },
  { label: 'Rule 8', status: 'NOT_IMPLEMENTED' },
  { label: 'Oral engine', status: 'NOT_CONNECTED' },
  { label: 'Tablet A/B engine', status: 'NOT_IMPLEMENTED' },
  { label: 'External engine', status: 'NOT_CONNECTED' },
  { label: 'Report processing', status: 'NOT_CONNECTED' },
  { label: 'Phase F', status: 'EXCLUDED_FROM_CLINICAL_AUTHORITY' },
  { label: 'Identifiable clinical records copied', status: 'NO' },
  { label: 'Real clinical output', status: 'NO' },
  { label: 'Phase 4B OTP provider', status: 'HOLD' },
];

export default function ClinicalIntegrationStatusPage() {
  if (!isLocalPreviewAllowed(process.env)) {
    notFound();
  }

  return (
    <main id="main-content" className="ehas2-preview-status" tabIndex={-1}>
      <PageHeader
        title="Clinical integration status"
        description="Phase 5B non-clinical board. Sanitized packages prepared; clinical engine NOT_CONNECTED."
      />
      <Surface>
        <p className="ehas2-field__hint" data-ehas2-status-disclaimer="true">
          SYNTHETIC DEMO — NOT CLINICAL OUTPUT — NOT SAVED. Audit and package status labels only.
        </p>
        <table className="ehas2-preview-status-table">
          <caption className="ehas2-sr-only">Clinical integration audit statuses</caption>
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>
                  <code>{row.status}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="ehas2-preview-truths">
          <li>No Principal / TenantContext / session</li>
          <li>No PostgreSQL writes · no live disease package install</li>
          <li>No clinical-engine / OCR / payment requests from this page</li>
          <li>Production mode: PREVIEW_NOT_AVAILABLE</li>
        </ul>
      </Surface>
    </main>
  );
}

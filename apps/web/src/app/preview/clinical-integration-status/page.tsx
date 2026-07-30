import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocalPreviewAllowed } from '../../../lib/preview/previewGate';
import { PageHeader, Surface } from '../../../components/ui/Primitives';

export const metadata: Metadata = {
  title: 'Clinical Integration Status · Preview · EHAS2',
  description: 'Non-clinical audit status only — no engine calls, no identifiable records.',
  robots: { index: false, follow: false },
};

const ROWS: ReadonlyArray<{ label: string; status: string }> = [
  { label: 'Nine-rule engine', status: 'AUDIT_ONLY' },
  {
    label: 'Disease dataset',
    status: 'VERIFIED count 116,284 (old DB read-only; not installed here)',
  },
  { label: 'Medicine registry', status: 'VERIFIED count 39 (MM file; not installed here)' },
  { label: 'Clinical engine', status: 'NOT_CONNECTED' },
  { label: 'Report processing', status: 'NOT_CONNECTED' },
  { label: 'Phase F', status: 'NOT_SELECTED' },
  { label: 'Identifiable clinical records', status: 'NOT_USED' },
  { label: 'Phase 4B OTP provider', status: 'HOLD' },
];

/**
 * Local preview status only. Performs no engine call, DB write, OTP, or clinical inference.
 */
export default function ClinicalIntegrationStatusPage() {
  if (!isLocalPreviewAllowed(process.env)) {
    notFound();
  }

  return (
    <main id="main-content" className="ehas2-preview-status" tabIndex={-1}>
      <PageHeader
        title="Clinical integration status"
        description="Non-clinical Phase 5A audit board. No clinical output. Not saved. Engine not called."
      />
      <Surface>
        <p className="ehas2-field__hint" data-ehas2-status-disclaimer="true">
          SYNTHETIC DEMO — NOT CLINICAL OUTPUT — NOT SAVED. This page contains audit labels only.
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
          <li>No PostgreSQL writes · no disease/medicine package install</li>
          <li>No clinical-engine / OCR / payment requests</li>
          <li>Production mode: PREVIEW_NOT_AVAILABLE</li>
        </ul>
      </Surface>
    </main>
  );
}

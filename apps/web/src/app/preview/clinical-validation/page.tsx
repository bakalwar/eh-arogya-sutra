import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocalPreviewAllowed } from '../../../lib/preview/previewGate';
import { PageHeader, Surface } from '../../../components/ui/Primitives';
import {
  CLINICAL_VALIDATION_DASHBOARD as D,
  SYNTHETIC_CASE_PREVIEWS,
} from '../../../lib/clinical-validation/dashboard';

export const metadata: Metadata = {
  title: 'Clinical Validation · Preview · EHAS2',
  description:
    'Phase 5C-G synthetic nine-rule validation and prescription readiness — non-clinical.',
  robots: { index: false, follow: false },
};

/**
 * Local-only Phase 5C-G validation board.
 * Static synthetic data — zero DB writes, zero old-server requests, no medicines.
 */
export default function ClinicalValidationPreviewPage() {
  if (!isLocalPreviewAllowed(process.env)) {
    notFound();
  }

  return (
    <main id="main-content" className="ehas2-preview-status" tabIndex={-1}>
      <p className="ehas2-field__hint" data-ehas2-validation-watermark="true">
        {D.watermark}
      </p>
      <PageHeader
        title="Clinical validation"
        description="Phase 5C-G closure — synthetic / read-only. Prescription engine NOT_CONNECTED."
      />
      <Surface>
        <table className="ehas2-preview-status-table" data-ehas2-clinical-validation="true">
          <caption className="ehas2-sr-only">Clinical validation statuses</caption>
          <thead>
            <tr>
              <th scope="col">Gate</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Phase 5C clean validation</th>
              <td>
                <code>{D.cleanValidationStatus}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Dataset</th>
              <td>
                <code>
                  {D.dataset.status} · full {D.dataset.expectedFullCount} · CI{' '}
                  {D.dataset.syntheticCiCount}
                </code>
              </td>
            </tr>
            <tr>
              <th scope="row">Medicine registry</th>
              <td>
                <code>
                  {D.registry.status} · {D.registry.count} · C11 {D.registry.c11}
                </code>
              </td>
            </tr>
            <tr>
              <th scope="row">Rule 8 readiness</th>
              <td>
                <code>
                  {D.rule8Status} · implementation {D.rule8Implementation}
                </code>
              </td>
            </tr>
            <tr>
              <th scope="row">Prescription readiness</th>
              <td>
                <code>
                  oral {D.prescriptionReadiness.oral} · potency {D.prescriptionReadiness.potency} ·
                  electricity {D.prescriptionReadiness.electricity} · TabletA{' '}
                  {D.prescriptionReadiness.tabletA} · TabletB {D.prescriptionReadiness.tabletB} ·
                  external {D.prescriptionReadiness.external}
                </code>
              </td>
            </tr>
            <tr>
              <th scope="row">Golden cases</th>
              <td>
                <code>
                  total {D.goldenCases.total} · passed {D.goldenCases.passed} · assertions{' '}
                  {D.goldenCases.assertionsMeaningful}
                </code>
              </td>
            </tr>
            <tr>
              <th scope="row">Determinism</th>
              <td>
                <code>{D.determinism}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Safety gate</th>
              <td>
                <code>{D.safetyGate}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Disease retrieval</th>
              <td>
                <code>{D.diseaseRetrieval}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Prescription engine</th>
              <td>
                <code>{D.prescriptionEngine}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Medicine output</th>
              <td>
                <code>{D.medicineOutput}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Patient data (production)</th>
              <td>
                <code>{D.realPatientData}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Clinical readiness</th>
              <td>
                <code>{String(D.clinicalReadiness).toUpperCase()}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Phase 5D ready</th>
              <td>
                <code>{String(D.phase5dReady).toUpperCase()}</code>
              </td>
            </tr>
            <tr>
              <th scope="row">Database writes from preview</th>
              <td>
                <code>{D.databaseWritesFromPreview}</code>
              </td>
            </tr>
          </tbody>
        </table>

        <h2 className="ehas2-preview-h2">Nine canonical rules</h2>
        <ul data-ehas2-nine-rules="true">
          {D.rules.map((r) => (
            <li key={r.ruleNumber}>
              <code>
                R{r.ruleNumber} {r.ruleName}: {r.status}
                {'note' in r && r.note ? ` (${r.note})` : ''}
              </code>
            </li>
          ))}
        </ul>

        <h2 className="ehas2-preview-h2">Synthetic case previews</h2>
        {SYNTHETIC_CASE_PREVIEWS.map((c) => (
          <article key={c.id} data-ehas2-synthetic-case={c.id} className="ehas2-preview-case">
            <h3>
              {c.id} — {c.title} <code>{c.label}</code>
            </h3>
            <p>
              Input: <code>{JSON.stringify(c.inputEvidence)}</code>
            </p>
            <p>
              Ranked candidates:{' '}
              <code>
                {c.rankedCandidates.length
                  ? c.rankedCandidates.map((x) => x.name).join(', ')
                  : 'NONE'}
              </code>
            </p>
            <p>
              Rule statuses: <code>{JSON.stringify(c.ruleStatuses)}</code>
            </p>
            <p>
              Warnings: <code>{c.warnings.join(', ') || 'none'}</code>
            </p>
            <p>
              Unresolved: <code>{c.unresolved.join(', ') || 'none'}</code>
            </p>
            <p>
              Fingerprints: <code>{JSON.stringify(c.fingerprints)}</code>
            </p>
            <p>
              Medicines: <code>NOT_SHOWN · PRESCRIPTION_ENGINE_NOT_CONNECTED</code>
            </p>
          </article>
        ))}

        <ul className="ehas2-preview-truths">
          <li>No Principal / TenantContext / session</li>
          <li>No PostgreSQL writes · no old-server requests</li>
          <li>No live prescription / potency / electricity / Tablet A/B</li>
          <li>Production mode: PREVIEW_NOT_AVAILABLE</li>
          <li>Phase 4B OTP provider: HOLD</li>
        </ul>
      </Surface>
    </main>
  );
}

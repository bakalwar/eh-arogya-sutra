'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { getSyntheticPatient } from '../../data/syntheticPatients';
import { BODY_SITES } from '../../lib/case/bodySites';
import { RED_FLAG_OPTIONS } from '../../lib/case/emergency';
import type { ClinicalCaseDraft } from '../../lib/case/types';
import { ValidatedField } from './ValidatedField';

function Section({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: ReactNode;
}) {
  return (
    <section className="ehas2-surface">
      <header className="ehas2-review-head">
        <h3>{title}</h3>
        <Link href={editHref}>Edit</Link>
      </header>
      {children}
    </section>
  );
}

export function ReviewStep({
  draft,
  consentError,
  onConsentChange,
}: {
  draft: ClinicalCaseDraft;
  consentError?: string;
  onConsentChange: (value: boolean) => void;
}) {
  const existing = getSyntheticPatient(draft.patient.existingPatientId);
  const patientLabel =
    draft.patient.mode === 'existing'
      ? (existing?.displayName ?? 'Not selected')
      : draft.patient.displayName || 'Not entered';
  const sites = BODY_SITES.filter((s) => draft.bodySites.siteIds.includes(s.id)).map(
    (s) => s.label,
  );

  return (
    <div className="ehas2-stack">
      <p role="status">
        Review shows entered draft only — no disease, medicine, potency, or findings.
      </p>
      <Section title="Patient" editHref="/cases/new?step=patient">
        <p>{patientLabel}</p>
        <p>
          Mode: {draft.patient.mode}
          {draft.patient.mode === 'new'
            ? ` · ${draft.patient.gender || '—'} · weight ${draft.patient.weightKg || '—'} kg`
            : ''}
        </p>
      </Section>
      <Section title="Vitals" editHref="/cases/new?step=vitals">
        <p>
          BP {draft.vitals.systolicBp || '—'}/{draft.vitals.diastolicBp || '—'} · Pulse{' '}
          {draft.vitals.pulse || '—'} · Temp {draft.vitals.temperatureC || '—'} · SpO₂{' '}
          {draft.vitals.oxygenSaturation || '—'}
        </p>
      </Section>
      <Section title="Chief complaint & symptoms" editHref="/cases/new?step=symptoms">
        <p>
          <strong>Chief complaint:</strong> {draft.symptoms.chiefComplaint || '—'}
        </p>
        <p>
          <strong>Symptoms:</strong> {draft.symptoms.completeSymptoms || '—'}
        </p>
        <p>
          Duration {draft.symptoms.duration || '—'} · Phase {draft.symptoms.phase || '—'} · Severity{' '}
          {draft.symptoms.severity || '—'}
        </p>
      </Section>
      <Section title="Clinical context" editHref="/cases/new?step=clinical">
        <p>Follow-up: {draft.clinical.followUpType || '—'}</p>
        <p>
          Temperament: {draft.clinical.temperament || 'not set'} · Constitution:{' '}
          {draft.clinical.constitution || 'not set'}
        </p>
        <p>
          Red flags:{' '}
          {draft.clinical.redFlags.length
            ? RED_FLAG_OPTIONS.filter((f) => draft.clinical.redFlags.includes(f.id))
                .map((f) => f.label)
                .join(', ')
            : 'None'}
        </p>
        <p>
          Emergency acknowledgement:{' '}
          {draft.clinical.emergencyAcknowledged ? 'Yes' : 'No / not required'}
        </p>
      </Section>
      <Section title="Affected sites" editHref="/cases/new?step=symptoms">
        <p>{sites.length ? sites.join(', ') : 'None'}</p>
        <p>Laterality: {draft.bodySites.laterality || '—'}</p>
        <p>{draft.bodySites.freeText || ''}</p>
      </Section>
      <Section title="Selected reports (metadata only)" editHref="/cases/new/reports">
        {draft.reports.length === 0 ? (
          <p>No reports selected.</p>
        ) : (
          <ul>
            {draft.reports.map((r) => (
              <li key={r.id}>
                {r.displayName} · {r.category} · {(r.sizeBytes / 1024).toFixed(1)} KB
              </li>
            ))}
          </ul>
        )}
      </Section>
      <ValidatedField id="consentAcknowledged" label="Preview acknowledgement" error={consentError}>
        <label>
          <input
            id="consentAcknowledged"
            type="checkbox"
            checked={draft.consentAcknowledged}
            onChange={(e) => onConsentChange(e.target.checked)}
          />{' '}
          I understand this is a UI preview: no clinical analysis, OCR, storage, or prescription
          will run.
        </label>
      </ValidatedField>
    </div>
  );
}

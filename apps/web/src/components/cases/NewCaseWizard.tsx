'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCaseDraft } from '../../context/CaseDraftProvider';
import { CASE_STEPS, type CaseStepId } from '../../lib/case/types';
import { firstErrorField, validateCaseStep } from '../../lib/case/validation';
import { Button } from '../ui/Button';
import { PageHeader, Surface } from '../ui/Primitives';
import { PreviewModeBanner } from '../entry/PreviewModeBanner';
import { CaseStepper } from './CaseStepper';
import { ClinicalContextStep } from './ClinicalContextStep';
import { ErrorSummary } from './ValidatedField';
import { PatientStep } from './PatientStep';
import { ReportsStep } from './ReportsStep';
import { ReviewStep } from './ReviewStep';
import { SymptomsStep } from './SymptomsStep';
import { VitalsStep } from './VitalsStep';

function stepHref(step: CaseStepId): string {
  if (step === 'reports') return '/cases/new/reports';
  if (step === 'review') return '/cases/new/review';
  return `/cases/new?step=${step}`;
}

export function NewCaseWizard({ initialStep }: { initialStep: CaseStepId }) {
  const router = useRouter();
  const { draft, setDraft, casePreviewId, markClean } = useCaseDraft();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const stepIndex = CASE_STEPS.findIndex((s) => s.id === initialStep);

  const title = useMemo(
    () => CASE_STEPS.find((s) => s.id === initialStep)?.label ?? 'New Case',
    [initialStep],
  );

  function focusField(field: string) {
    const el = document.getElementById(field) ?? document.getElementById('case-error-summary');
    el?.focus?.();
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function goNext() {
    const nextErrors = validateCaseStep(initialStep, draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = firstErrorField(nextErrors);
      requestAnimationFrame(() => {
        document.getElementById('case-error-summary')?.focus();
        if (first) focusField(first);
      });
      return;
    }
    if (initialStep === 'review') {
      markClean();
      router.push(`/cases/${casePreviewId}/analysis`);
      return;
    }
    const next = CASE_STEPS[stepIndex + 1];
    if (next) router.push(stepHref(next.id));
  }

  function goBack() {
    const prev = CASE_STEPS[stepIndex - 1];
    if (prev) router.push(stepHref(prev.id));
  }

  return (
    <div className="ehas2-stack">
      <PreviewModeBanner message="NEW CASE UI PREVIEW — in-memory only; no persistence or upload" />
      <PageHeader title={`New Case · ${title}`} description="Multi-step clinical intake preview." />
      <CaseStepper current={initialStep} hrefForStep={stepHref} />
      <ErrorSummary errors={errors} onFocusField={focusField} />
      <Surface>
        {initialStep === 'patient' ? (
          <PatientStep
            value={draft.patient}
            errors={errors}
            onChange={(patient) => setDraft((d) => ({ ...d, patient }))}
          />
        ) : null}
        {initialStep === 'vitals' ? (
          <VitalsStep
            value={draft.vitals}
            errors={errors}
            onChange={(vitals) => setDraft((d) => ({ ...d, vitals }))}
          />
        ) : null}
        {initialStep === 'symptoms' ? (
          <SymptomsStep
            symptoms={draft.symptoms}
            bodySites={draft.bodySites}
            errors={errors}
            onSymptomsChange={(symptoms) => setDraft((d) => ({ ...d, symptoms }))}
            onBodySitesChange={(bodySites) => setDraft((d) => ({ ...d, bodySites }))}
          />
        ) : null}
        {initialStep === 'clinical' ? (
          <ClinicalContextStep
            value={draft.clinical}
            errors={errors}
            onChange={(clinical) => setDraft((d) => ({ ...d, clinical }))}
          />
        ) : null}
        {initialStep === 'reports' ? <ReportsStep /> : null}
        {initialStep === 'review' ? (
          <ReviewStep
            draft={draft}
            consentError={errors.consentAcknowledged}
            onConsentChange={(consentAcknowledged) =>
              setDraft((d) => ({ ...d, consentAcknowledged }))
            }
          />
        ) : null}
      </Surface>
      <div className="ehas2-action-row">
        {stepIndex > 0 ? (
          <Button type="button" variant="ghost" onClick={goBack}>
            Back
          </Button>
        ) : (
          <Link className="ehas2-btn ehas2-btn--ghost" href="/patients">
            Patients
          </Link>
        )}
        <Button type="button" variant="primary" onClick={goNext}>
          {initialStep === 'review' ? 'Analyze (preview)' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

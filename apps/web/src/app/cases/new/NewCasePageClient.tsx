'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { NewCaseWizard } from '../../../components/cases/NewCaseWizard';
import { useCaseDraft } from '../../../context/CaseDraftProvider';
import type { CaseStepId } from '../../../lib/case/types';

const STEPS: CaseStepId[] = ['patient', 'vitals', 'symptoms', 'clinical', 'reports', 'review'];

export function NewCasePageClient() {
  const params = useSearchParams();
  const stepParam = params.get('step') ?? 'patient';
  const patientId = params.get('patient');
  const { setDraft } = useCaseDraft();
  const step = (STEPS.includes(stepParam as CaseStepId) ? stepParam : 'patient') as CaseStepId;

  useEffect(() => {
    if (!patientId?.startsWith('syn-patient-')) return;
    setDraft((d) => ({
      ...d,
      patient: {
        ...d.patient,
        mode: 'existing',
        existingPatientId: patientId,
      },
    }));
  }, [patientId, setDraft]);

  return <NewCaseWizard initialStep={step} />;
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { PrescriptionView } from '../../../../components/clinical/PrescriptionView';
import { ClinicalLoadError } from '../../../../components/clinical/ClinicalLoadError';
import { loadCaseClinicalResult } from '../../../../lib/clinicalDisplay/loadResult';
import { NotGeneratedState } from '../../../../components/clinical/ClinicalPrimitives';

export const metadata: Metadata = {
  title: 'Prescription · E.H. AROGYA SUTRA 2',
  description: 'Synthetic prescription layout — not a generated clinical result.',
};

export default async function CasePrescriptionPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const loaded = loadCaseClinicalResult(caseId);
  if (!loaded.ok) return <ClinicalLoadError error={loaded.error} />;
  if (loaded.result.prescriptionStatus === 'not-generated') {
    return (
      <div className="ehas2-stack">
        <NotGeneratedState reason="Analysis / prescription not generated for this demo case." />
        <Link className="ehas2-btn ehas2-btn--secondary" href="/prescriptions">
          Prescription history
        </Link>
      </div>
    );
  }
  return <PrescriptionView result={loaded.result} />;
}

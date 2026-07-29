import type { Metadata } from 'next';
import Link from 'next/link';
import { ClinicianReviewPanel } from '../../../../components/clinical/SummaryAndReview';
import { DemoClinicalBanner } from '../../../../components/clinical/ClinicalPrimitives';
import { PageHeader, Surface } from '../../../../components/ui/Primitives';
import { ClinicalLoadError } from '../../../../components/clinical/ClinicalLoadError';
import { loadCaseClinicalResult } from '../../../../lib/clinicalDisplay/loadResult';

export const metadata: Metadata = {
  title: 'Clinician review · E.H. AROGYA SUTRA 2',
  description: 'Clinician review UI preview — review service not connected.',
};

export default async function CaseReviewPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const loaded = loadCaseClinicalResult(caseId);
  if (!loaded.ok) return <ClinicalLoadError error={loaded.error} />;
  return (
    <div className="ehas2-stack">
      <DemoClinicalBanner />
      <PageHeader
        title="Clinician review"
        description="UI states only — no database write or audit transmission."
      />
      <Surface>
        <p>Case {loaded.result.caseContext.casePreviewId}</p>
        <Link className="ehas2-btn ehas2-btn--secondary" href={`/cases/${caseId}/prescription`}>
          View prescription layout
        </Link>
      </Surface>
      <ClinicianReviewPanel status={loaded.result.clinicianReviewStatus} />
    </div>
  );
}

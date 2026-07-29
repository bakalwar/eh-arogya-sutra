import type { Metadata } from 'next';
import { ClinicalSummaryView } from '../../../../components/clinical/SummaryAndReview';
import { DemoClinicalBanner } from '../../../../components/clinical/ClinicalPrimitives';
import { PageHeader } from '../../../../components/ui/Primitives';
import { ClinicalLoadError } from '../../../../components/clinical/ClinicalLoadError';
import { loadCaseClinicalResult } from '../../../../lib/clinicalDisplay/loadResult';

export const metadata: Metadata = {
  title: 'Clinical summary · E.H. AROGYA SUTRA 2',
  description: 'Complete multimodal clinical summary layout — synthetic only.',
};

export default async function CaseSummaryPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const loaded = loadCaseClinicalResult(caseId);
  if (!loaded.ok) return <ClinicalLoadError error={loaded.error} />;
  return (
    <div className="ehas2-stack">
      <DemoClinicalBanner />
      <PageHeader
        title="Complete multimodal clinical summary"
        description="Structured synthetic sections only — no legacy summary runtime."
      />
      <ClinicalSummaryView result={loaded.result} />
    </div>
  );
}

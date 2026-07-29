import type { Metadata } from 'next';
import { AnalysisNotConnected } from '../../../../components/cases/AnalysisNotConnected';
import { PageHeader } from '../../../../components/ui/Primitives';
import { PreviewModeBanner } from '../../../../components/entry/PreviewModeBanner';
import { ErrorState } from '../../../../components/ui/Primitives';

export const metadata: Metadata = {
  title: 'Analysis · E.H. AROGYA SUTRA 2',
  description: 'Analysis not connected — no prescription generated.',
};

export default async function CaseAnalysisPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  if (!caseId.startsWith('preview-case-') && !caseId.startsWith('syn-case-')) {
    return (
      <div className="ehas2-stack">
        <ErrorState
          title="Invalid case preview ID"
          body="Only synthetic preview case IDs are accepted."
        />
      </div>
    );
  }
  return (
    <div className="ehas2-stack">
      <PreviewModeBanner message="ANALYSIS UI PREVIEW — clinical engine not connected" />
      <PageHeader title="Case analysis" description="Truthful not-connected states only." />
      <AnalysisNotConnected caseId={caseId} />
    </div>
  );
}

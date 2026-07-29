import type { Metadata } from 'next';
import { PrintPrescriptionLayout } from '../../../components/clinical/PrintPrescriptionLayout';
import { ClinicalLoadError } from '../../../components/clinical/ClinicalLoadError';
import { loadCaseClinicalResult } from '../../../lib/clinicalDisplay/loadResult';

export const metadata: Metadata = {
  title: 'Print preview · E.H. AROGYA SUTRA 2',
  description: 'Browser print preview — PDF service not connected.',
};

export default async function PrintCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const loaded = loadCaseClinicalResult(caseId);
  if (!loaded.ok) return <ClinicalLoadError error={loaded.error} />;
  return (
    <main className="ehas2-print-page-shell" id="main-content">
      <PrintPrescriptionLayout result={loaded.result} />
    </main>
  );
}

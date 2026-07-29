import type { Metadata } from 'next';
import { DoctorShell } from '../../../components/shell/DoctorShell';
import { PrescriptionView } from '../../../components/clinical/PrescriptionView';
import { ErrorState } from '../../../components/ui/Primitives';
import { getClinicalResultByPrescriptionId } from '../../../data/syntheticClinicalResults';
import { NotGeneratedState } from '../../../components/clinical/ClinicalPrimitives';

export const metadata: Metadata = {
  title: 'Prescription detail · E.H. AROGYA SUTRA 2',
  description: 'Synthetic prescription detail preview.',
};

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ prescriptionId: string }>;
}) {
  const { prescriptionId } = await params;
  if (!prescriptionId.startsWith('syn-rx-')) {
    return (
      <DoctorShell currentPath="/prescriptions">
        <ErrorState
          title="Invalid prescription ID"
          body="Only synthetic prescription IDs (syn-rx-*) are accepted."
        />
      </DoctorShell>
    );
  }
  const result = getClinicalResultByPrescriptionId(prescriptionId);
  if (!result) {
    return (
      <DoctorShell currentPath="/prescriptions">
        <NotGeneratedState reason="No synthetic prescription detail found." />
      </DoctorShell>
    );
  }
  return (
    <DoctorShell currentPath={`/prescriptions/${prescriptionId}`}>
      <PrescriptionView result={result} />
    </DoctorShell>
  );
}

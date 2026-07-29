import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DoctorShell } from '../../../components/shell/DoctorShell';
import { PatientDetailView } from '../../../components/patients/PatientProfileHeader';
import { getSyntheticPatient } from '../../../data/syntheticPatients';
import { ErrorState } from '../../../components/ui/Primitives';

export const metadata: Metadata = {
  title: 'Patient detail · E.H. AROGYA SUTRA 2',
  description: 'Synthetic patient detail preview.',
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  if (!patientId.startsWith('syn-patient-')) {
    return (
      <DoctorShell currentPath="/patients">
        <ErrorState
          title="Invalid preview ID"
          body="Only synthetic patient IDs (syn-patient-*) are accepted in Phase 1C-B."
        />
      </DoctorShell>
    );
  }
  const patient = getSyntheticPatient(patientId);
  if (!patient) notFound();
  return (
    <DoctorShell currentPath={`/patients/${patientId}`}>
      <PatientDetailView patient={patient} />
    </DoctorShell>
  );
}

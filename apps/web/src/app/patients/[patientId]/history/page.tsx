import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DoctorShell } from '../../../../components/shell/DoctorShell';
import { ConsultationTimeline } from '../../../../components/patients/ConsultationTimeline';
import {
  SYNTHETIC_DATA_BANNER,
  getPatientConsultations,
  getSyntheticPatient,
} from '../../../../data/syntheticPatients';
import { Breadcrumbs, PageHeader, Surface } from '../../../../components/ui/Primitives';
import { PreviewModeBanner } from '../../../../components/entry/PreviewModeBanner';

export const metadata: Metadata = {
  title: 'Patient history · E.H. AROGYA SUTRA 2',
  description: 'Synthetic consultation history preview.',
};

export default async function PatientHistoryPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const patient = getSyntheticPatient(patientId);
  if (!patient) notFound();
  const consultations = getPatientConsultations(patientId);
  return (
    <DoctorShell currentPath={`/patients/${patientId}/history`}>
      <div className="ehas2-stack">
        <PreviewModeBanner message={SYNTHETIC_DATA_BANNER} />
        <Breadcrumbs
          items={[
            { label: 'Patients', href: '/patients' },
            { label: patient.displayName, href: `/patients/${patientId}` },
            { label: 'History' },
          ]}
        />
        <PageHeader
          title={`${patient.displayName} · History`}
          description="Synthetic timeline only. Prescription details come in Phase 1C-C."
        />
        <Surface>
          <ConsultationTimeline consultations={consultations} />
        </Surface>
        <Link className="ehas2-btn ehas2-btn--secondary" href={`/patients/${patientId}`}>
          Back to profile
        </Link>
      </div>
    </DoctorShell>
  );
}

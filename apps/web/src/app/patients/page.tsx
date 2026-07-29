import type { Metadata } from 'next';
import { DoctorShell } from '../../components/shell/DoctorShell';
import { PatientList } from '../../components/patients/PatientList';

export const metadata: Metadata = {
  title: 'Patients · E.H. AROGYA SUTRA 2',
  description: 'Synthetic patient list preview — no patient database connected.',
};

export default function PatientsPage() {
  return (
    <DoctorShell currentPath="/patients">
      <PatientList />
    </DoctorShell>
  );
}

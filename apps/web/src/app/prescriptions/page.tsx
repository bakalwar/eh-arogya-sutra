import type { Metadata } from 'next';
import { DoctorShell } from '../../components/shell/DoctorShell';
import { PrescriptionHistoryList } from '../../components/clinical/PrescriptionHistoryList';
import { SYNTHETIC_PRESCRIPTION_HISTORY } from '../../data/syntheticClinicalResults';

export const metadata: Metadata = {
  title: 'Prescriptions · E.H. AROGYA SUTRA 2',
  description: 'Synthetic prescription history preview.',
};

export default function PrescriptionsPage() {
  return (
    <DoctorShell currentPath="/prescriptions">
      <PrescriptionHistoryList items={SYNTHETIC_PRESCRIPTION_HISTORY} />
    </DoctorShell>
  );
}

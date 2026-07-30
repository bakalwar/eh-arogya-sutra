import type { Metadata } from 'next';
import { ClinicHoursPage } from '../../../components/profile/ProfilePages';

export const metadata: Metadata = {
  title: 'Clinic hours · E.H. AROGYA SUTRA 2',
};

export default function Page() {
  return <ClinicHoursPage currentPath="/clinic/hours" />;
}

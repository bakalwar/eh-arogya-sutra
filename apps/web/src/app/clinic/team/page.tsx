import type { Metadata } from 'next';
import { ClinicTeamPage } from '../../../components/profile/ProfilePages';

export const metadata: Metadata = {
  title: 'Clinic team · E.H. AROGYA SUTRA 2',
};

export default function Page() {
  return <ClinicTeamPage currentPath="/clinic/team" />;
}

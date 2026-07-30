import type { Metadata } from 'next';
import { ClinicSettingsPage } from '../../../components/profile/ProfilePages';

export const metadata: Metadata = {
  title: 'Clinic settings · E.H. AROGYA SUTRA 2',
};

export default function Page() {
  return <ClinicSettingsPage currentPath="/clinic/settings" />;
}

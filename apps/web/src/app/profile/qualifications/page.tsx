import type { Metadata } from 'next';
import { ProfileQualificationsPage } from '../../../components/profile/ProfilePages';

export const metadata: Metadata = {
  title: 'Qualifications · E.H. AROGYA SUTRA 2',
};

export default function Page() {
  return <ProfileQualificationsPage currentPath="/profile/qualifications" />;
}

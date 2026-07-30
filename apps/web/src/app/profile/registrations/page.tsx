import type { Metadata } from 'next';
import { ProfileRegistrationsPage } from '../../../components/profile/ProfilePages';

export const metadata: Metadata = {
  title: 'Registrations · E.H. AROGYA SUTRA 2',
};

export default function Page() {
  return <ProfileRegistrationsPage currentPath="/profile/registrations" />;
}

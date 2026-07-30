import type { Metadata } from 'next';
import { ProfileEditPage } from '../../../components/profile/ProfilePages';

export const metadata: Metadata = {
  title: 'Edit profile · E.H. AROGYA SUTRA 2',
};

export default function Page() {
  return <ProfileEditPage currentPath="/profile/edit" />;
}

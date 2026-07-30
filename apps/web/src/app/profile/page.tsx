import type { Metadata } from 'next';
import { ProfileHomePage } from '../../components/profile/ProfilePages';

export const metadata: Metadata = {
  title: 'My Profile · E.H. AROGYA SUTRA 2',
};

export default function Page() {
  return <ProfileHomePage currentPath="/profile" />;
}

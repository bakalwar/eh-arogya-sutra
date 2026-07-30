import type { Metadata } from 'next';
import { PrescriberPreviewPage } from '../../../components/profile/ProfilePages';

export const metadata: Metadata = {
  title: 'Prescriber preview · E.H. AROGYA SUTRA 2',
};

export default function Page() {
  return <PrescriberPreviewPage currentPath="/profile/prescriber-preview" />;
}

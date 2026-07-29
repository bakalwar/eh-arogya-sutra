import type { Metadata } from 'next';
import { DoctorFeedbackForm } from '../../components/feedback/DoctorFeedbackForm';

export const metadata: Metadata = {
  title: 'Feedback & Support · E.H. AROGYA SUTRA 2',
};

export default function FeedbackPage() {
  return <DoctorFeedbackForm currentPath="/feedback" />;
}

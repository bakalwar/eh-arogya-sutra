import type { Metadata } from 'next';
import { NewCaseWizard } from '../../../../components/cases/NewCaseWizard';

export const metadata: Metadata = {
  title: 'Case review · E.H. AROGYA SUTRA 2',
  description: 'Case review preview — no analysis or prescription.',
};

export default function NewCaseReviewPage() {
  return <NewCaseWizard initialStep="review" />;
}

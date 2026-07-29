import type { Metadata } from 'next';
import { NewCaseWizard } from '../../../../components/cases/NewCaseWizard';

export const metadata: Metadata = {
  title: 'Case reports · E.H. AROGYA SUTRA 2',
  description: 'Report selection preview — files stay in the browser.',
};

export default function NewCaseReportsPage() {
  return <NewCaseWizard initialStep="reports" />;
}

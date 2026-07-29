'use client';

import { useCaseDraft } from '../../context/CaseDraftProvider';
import { ReportUploader } from './ReportUploader';

export function ReportsStep() {
  const { localReports, setLocalReports } = useCaseDraft();
  return <ReportUploader reports={localReports} onChange={(next) => setLocalReports(() => next)} />;
}

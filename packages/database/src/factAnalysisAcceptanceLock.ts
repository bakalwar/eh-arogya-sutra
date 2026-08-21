/** Canonical E1 acceptance-subject advisory lock key (SQL + TypeScript). */
export function factAnalysisAcceptanceSubjectLockKey(
  organizationId: string,
  clinicId: string,
  factCandidateId: string,
): string {
  return (
    'ehas2:fact-analysis-acceptance:v1:' +
    `${String(organizationId).trim().toLowerCase()}:` +
    `${String(clinicId).trim().toLowerCase()}:` +
    `${String(factCandidateId).trim().toLowerCase()}`
  );
}

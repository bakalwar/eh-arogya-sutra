/** Canonical D5 verification-subject advisory lock key (SQL + TypeScript). */
export function factVerificationSubjectLockKey(
  organizationId: string,
  clinicId: string,
  factCandidateId: string,
): string {
  return (
    'ehas2:fact-verification:v1:' +
    `${String(organizationId).trim().toLowerCase()}:` +
    `${String(clinicId).trim().toLowerCase()}:` +
    `${String(factCandidateId).trim().toLowerCase()}`
  );
}

import type { TenantContext, TransactionContext } from '../tenantContext.js';
import {
  lockChiefComplaintCueSource,
  lockF3cReviewedCueSource,
  lockStructuredVitalSourceFields,
} from './cueSourceLock.js';
import { isStructuredVitalSourceField } from './structuredVitalSource.js';
import { recordRulesShadowInputLockTrace } from './rulesShadowInputLockTrace.js';

/**
 * Canonical cross-family source lock order (matches production writers):
 *   consultationIntakeService: chief → structured vitals
 *   factCandidateService / D3 / D5 / E1: per-fact source lock before fact identity
 * Multi-family batch order within one transaction:
 *   1) CHIEF_COMPLAINT (one per consultation)
 *   2) F3C_REVIEWED (sorted extraction candidate IDs)
 *   3) STRUCTURED_VITAL (sorted vital source fields)
 */
export type CanonicalSourceLockFamily = 'CHIEF_COMPLAINT' | 'F3C_REVIEWED' | 'STRUCTURED_VITAL';

export const CANONICAL_SOURCE_LOCK_FAMILY_ORDER: readonly CanonicalSourceLockFamily[] = [
  'CHIEF_COMPLAINT',
  'F3C_REVIEWED',
  'STRUCTURED_VITAL',
];

export type CanonicalSourceLockSubject = {
  family: CanonicalSourceLockFamily;
  consultationId: string;
  extractionCandidateId?: string;
  vitalSourceField?: string;
};

export type SourceLockFactPeek = {
  sourceChannel: string;
  sourceField: string;
  extractionCandidateId: string | null;
};

export function compareCanonicalSourceLockSubjects(
  a: CanonicalSourceLockSubject,
  b: CanonicalSourceLockSubject,
): number {
  const familyRank = (family: CanonicalSourceLockFamily): number =>
    CANONICAL_SOURCE_LOCK_FAMILY_ORDER.indexOf(family);
  const ra = familyRank(a.family);
  const rb = familyRank(b.family);
  if (ra !== rb) return ra - rb;
  if (a.family === 'CHIEF_COMPLAINT') {
    return a.consultationId < b.consultationId ? -1 : a.consultationId > b.consultationId ? 1 : 0;
  }
  if (a.family === 'F3C_REVIEWED') {
    const ca = a.extractionCandidateId ?? '';
    const cb = b.extractionCandidateId ?? '';
    if (ca !== cb) return ca < cb ? -1 : 1;
    return a.consultationId < b.consultationId ? -1 : a.consultationId > b.consultationId ? 1 : 0;
  }
  const fa = a.vitalSourceField ?? '';
  const fb = b.vitalSourceField ?? '';
  if (fa !== fb) return fa < fb ? -1 : 1;
  return a.consultationId < b.consultationId ? -1 : a.consultationId > b.consultationId ? 1 : 0;
}

export function buildCanonicalSourceLockSubjectsFromFacts(
  consultationId: string,
  facts: readonly SourceLockFactPeek[],
): CanonicalSourceLockSubject[] {
  const subjects: CanonicalSourceLockSubject[] = [];
  const seen = new Set<string>();

  for (const fact of facts) {
    if (fact.sourceChannel === 'DOCTOR_DECLARED' && fact.sourceField === 'CHIEF_COMPLAINT') {
      const key = `CHIEF:${consultationId}`;
      if (!seen.has(key)) {
        seen.add(key);
        subjects.push({ family: 'CHIEF_COMPLAINT', consultationId });
      }
    } else if (
      fact.sourceChannel === 'REVIEWED_REPORT_TEXT' &&
      fact.sourceField === 'REVIEWED_EXTRACTION_CANDIDATE' &&
      fact.extractionCandidateId
    ) {
      const key = `F3C:${fact.extractionCandidateId}`;
      if (!seen.has(key)) {
        seen.add(key);
        subjects.push({
          family: 'F3C_REVIEWED',
          consultationId,
          extractionCandidateId: fact.extractionCandidateId,
        });
      }
    } else if (
      fact.sourceChannel === 'STRUCTURED_INTAKE' &&
      isStructuredVitalSourceField(fact.sourceField)
    ) {
      const key = `VITAL:${fact.sourceField}`;
      if (!seen.has(key)) {
        seen.add(key);
        subjects.push({
          family: 'STRUCTURED_VITAL',
          consultationId,
          vitalSourceField: fact.sourceField,
        });
      }
    }
  }

  return subjects.sort(compareCanonicalSourceLockSubjects);
}

/**
 * Acquire all planned source locks in canonical cross-family order.
 * Structured vitals are batched per consultation in sorted field order.
 */
export async function acquireCanonicalSourceLocks(
  tenant: TenantContext,
  tx: TransactionContext,
  subjects: readonly CanonicalSourceLockSubject[],
): Promise<void> {
  const sorted = [...subjects].sort(compareCanonicalSourceLockSubjects);
  let chiefLocked = false;
  const f3cIds: string[] = [];
  const vitalFieldsByConsultation = new Map<string, string[]>();

  for (const subject of sorted) {
    if (subject.family === 'CHIEF_COMPLAINT') {
      if (!chiefLocked) {
        await lockChiefComplaintCueSource(tx, tenant, subject.consultationId);
        recordRulesShadowInputLockTrace({
          class: 'source',
          family: 'CHIEF_COMPLAINT',
          subject: subject.consultationId,
        });
        chiefLocked = true;
      }
    } else if (subject.family === 'F3C_REVIEWED' && subject.extractionCandidateId) {
      f3cIds.push(subject.extractionCandidateId);
    } else if (subject.family === 'STRUCTURED_VITAL' && subject.vitalSourceField) {
      const list = vitalFieldsByConsultation.get(subject.consultationId) ?? [];
      list.push(subject.vitalSourceField);
      vitalFieldsByConsultation.set(subject.consultationId, list);
    }
  }

  for (const candidateId of [...new Set(f3cIds)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    await lockF3cReviewedCueSource(tx, tenant, candidateId);
    recordRulesShadowInputLockTrace({
      class: 'source',
      family: 'F3C_REVIEWED',
      subject: candidateId,
    });
  }

  for (const [consultationId, fields] of [...vitalFieldsByConsultation.entries()].sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
  )) {
    const lockedFields = await lockStructuredVitalSourceFields(tx, tenant, consultationId, fields);
    for (const field of lockedFields) {
      recordRulesShadowInputLockTrace({
        class: 'source',
        family: 'STRUCTURED_VITAL',
        subject: field,
      });
    }
  }
}

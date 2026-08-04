import type {
  Rule4EvidenceAdapterOutput,
  Rule4EvidenceItemEnvelope,
  Rule4ItemGateResult,
  Rule4DocumentGateResult,
} from '../evidence/types.js';
import type { Rule4D3D5DiscriminatorEnvelope, Rule4D3D5EvidenceProvenanceRecord } from './types.js';

const EXECUTABLE_ASSERTIONS = new Set(['PRESENT', 'POSITIVE']);
const REJECTED_ASSERTIONS = new Set([
  'NEGATED',
  'RULE_OUT',
  'SUSPECTED',
  'UNKNOWN',
  'AMBIGUOUS',
  'HISTORICAL_ONLY',
  'RESOLVED',
]);
const ACCEPTABLE_VERIFICATION = new Set(['SUPPORTED', 'VERIFIED']);

export type Rule4D3D5EvidenceProvenanceValidation = {
  ok: boolean;
  reasonCode?: string;
  records: Rule4D3D5EvidenceProvenanceRecord[];
  authoritativeDocumentStatus: 'USABLE' | 'NOT_USABLE';
  authoritativeDocumentConfidence: 'PASS' | 'FAIL';
  authoritativeItemStatus: 'USABLE' | 'NOT_USABLE';
  authoritativeItemConfidence: 'PASS' | 'FAIL';
};

function itemGateMap(adapter: Rule4EvidenceAdapterOutput): Map<string, Rule4ItemGateResult> {
  return new Map(adapter.itemGateResults.map((r) => [r.findingId, r]));
}

function documentGateMap(
  adapter: Rule4EvidenceAdapterOutput,
): Map<string, Rule4DocumentGateResult> {
  return new Map(adapter.documentGateResults.map((r) => [r.documentId, r]));
}

function itemExecutable(item: Rule4EvidenceItemEnvelope): boolean {
  if (REJECTED_ASSERTIONS.has(item.assertionStatus)) {
    return false;
  }
  if (!EXECUTABLE_ASSERTIONS.has(item.assertionStatus)) {
    return false;
  }
  if (!ACCEPTABLE_VERIFICATION.has(item.verificationStatus)) {
    return false;
  }
  if (item.formulaRelevance !== 'DIRECT') {
    return false;
  }
  return true;
}

export function validateD3D5EvidenceProvenance(
  envelope: Rule4D3D5DiscriminatorEnvelope,
  ctx: {
    formulaSlotId: string;
    formulaTargetId: string;
    evidenceAdapter?: Rule4EvidenceAdapterOutput | null;
    evidenceItems?: readonly Rule4EvidenceItemEnvelope[] | null;
  },
): Rule4D3D5EvidenceProvenanceValidation {
  const emptyFail = (
    code: string,
    records: Rule4D3D5EvidenceProvenanceRecord[] = [],
  ): Rule4D3D5EvidenceProvenanceValidation => ({
    ok: false,
    reasonCode: code,
    records,
    authoritativeDocumentStatus: 'NOT_USABLE',
    authoritativeDocumentConfidence: 'FAIL',
    authoritativeItemStatus: 'NOT_USABLE',
    authoritativeItemConfidence: 'FAIL',
  });

  const adapter = ctx.evidenceAdapter;
  if (!adapter) {
    return emptyFail('D3_D5_EVIDENCE_POOL_MISSING');
  }

  const pool = adapter.formulaBoundPools.find(
    (p) => p.formulaSlotId === ctx.formulaSlotId && p.formulaTargetId === ctx.formulaTargetId,
  );
  if (!pool) {
    return emptyFail('D3_D5_EVIDENCE_POOL_MISSING');
  }

  if (pool.contradiction.evidenceStatus === 'CONTRADICTORY_EVIDENCE') {
    return emptyFail('D3_D5_EVIDENCE_POOL_CONTRADICTORY');
  }

  const ids = [...envelope.evidenceItemIds];
  if (ids.length === 0) {
    return emptyFail('D3_D5_EVIDENCE_MEMBERSHIP_INVALID');
  }
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    return emptyFail('D3_D5_EVIDENCE_ITEM_GATE_NOT_MET');
  }

  const usable = new Set(pool.usableFindingIds);
  const ignored = new Set(pool.ignoredFindingIds);
  const itemsByFinding = new Map((ctx.evidenceItems ?? []).map((i) => [i.findingId, i]));
  const itemGates = itemGateMap(adapter);
  const docGates = documentGateMap(adapter);
  const ignoredAuditIds = new Set(adapter.ignoredAudit.map((e) => e.findingId));
  const supersededIds = new Set(
    adapter.dedupeSupersession
      .filter((m) => m.supersededByFindingId != null)
      .map((m) => m.findingId),
  );

  const records: Rule4D3D5EvidenceProvenanceRecord[] = [];

  for (const findingId of uniqueIds.sort()) {
    if (ignored.has(findingId) || ignoredAuditIds.has(findingId) || supersededIds.has(findingId)) {
      return emptyFail('D3_D5_EVIDENCE_ITEM_GATE_NOT_MET', records);
    }
    if (!usable.has(findingId)) {
      return emptyFail('D3_D5_EVIDENCE_MEMBERSHIP_INVALID', records);
    }

    const item = itemsByFinding.get(findingId);
    if (
      !item ||
      item.formulaSlotId !== ctx.formulaSlotId ||
      item.formulaTargetId !== ctx.formulaTargetId
    ) {
      return emptyFail('D3_D5_EVIDENCE_MEMBERSHIP_INVALID', records);
    }

    if (!itemExecutable(item)) {
      return emptyFail('D3_D5_EVIDENCE_ITEM_GATE_NOT_MET', records);
    }

    const itemGate = itemGates.get(findingId);
    if (!itemGate || !itemGate.passed) {
      return emptyFail('D3_D5_EVIDENCE_ITEM_GATE_NOT_MET', records);
    }
    if (itemGate.findingId !== findingId) {
      return emptyFail('D3_D5_EVIDENCE_ITEM_GATE_NOT_MET', records);
    }
    if (!itemGate.documentId || itemGate.documentId !== item.documentId) {
      return emptyFail('D3_D5_EVIDENCE_DOCUMENT_BINDING_INVALID', records);
    }

    const docGate = docGates.get(item.documentId);
    if (!docGate || !docGate.passed) {
      return emptyFail('D3_D5_EVIDENCE_DOCUMENT_GATE_NOT_MET', records);
    }

    records.push({
      findingId,
      documentId: item.documentId,
      itemGatePassed: true,
      documentGatePassed: true,
    });
  }

  const allDocsPass = records.every((r) => r.documentGatePassed);
  const allItemsPass = records.every((r) => r.itemGatePassed);

  const authoritativeDocumentStatus = allDocsPass ? 'USABLE' : 'NOT_USABLE';
  const authoritativeDocumentConfidence = allDocsPass ? 'PASS' : 'FAIL';
  const authoritativeItemStatus = allItemsPass ? 'USABLE' : 'NOT_USABLE';
  const authoritativeItemConfidence = allItemsPass ? 'PASS' : 'FAIL';

  return {
    ok: true,
    records,
    authoritativeDocumentStatus,
    authoritativeDocumentConfidence,
    authoritativeItemStatus,
    authoritativeItemConfidence,
  };
}

function provenanceRecordKey(r: Rule4D3D5EvidenceProvenanceRecord): string {
  return `${r.findingId}|${r.documentId}|${r.itemGatePassed}|${r.documentGatePassed}`;
}

export function envelopeEvidenceProvenanceMatchesAuthoritative(
  envelope: Rule4D3D5DiscriminatorEnvelope,
  records: readonly Rule4D3D5EvidenceProvenanceRecord[],
): { ok: boolean; reasonCode?: string } {
  const claimed = envelope.evidenceProvenance ?? [];
  if (claimed.length !== records.length) {
    return { ok: false, reasonCode: 'D3_D5_EVIDENCE_PROVENANCE_MISMATCH' };
  }
  const authKeys = [...records]
    .sort((a, b) => a.findingId.localeCompare(b.findingId))
    .map(provenanceRecordKey);
  const claimKeys = [...claimed]
    .sort((a, b) => a.findingId.localeCompare(b.findingId))
    .map(provenanceRecordKey);
  for (let i = 0; i < authKeys.length; i++) {
    if (authKeys[i] !== claimKeys[i]) {
      return { ok: false, reasonCode: 'D3_D5_EVIDENCE_PROVENANCE_MISMATCH' };
    }
  }
  return { ok: true };
}

export function envelopeD08MatchesAuthoritative(
  envelope: Rule4D3D5DiscriminatorEnvelope,
  auth: Pick<
    Rule4D3D5EvidenceProvenanceValidation,
    | 'authoritativeDocumentStatus'
    | 'authoritativeDocumentConfidence'
    | 'authoritativeItemStatus'
    | 'authoritativeItemConfidence'
  >,
): { ok: boolean; reasonCode?: string } {
  if (
    envelope.d08DocumentStatus !== auth.authoritativeDocumentStatus ||
    envelope.d08DocumentConfidence !== auth.authoritativeDocumentConfidence
  ) {
    return { ok: false, reasonCode: 'D08_DOCUMENT_GATE_NOT_MET' };
  }
  if (
    envelope.d08ItemStatus !== auth.authoritativeItemStatus ||
    envelope.d08ItemConfidence !== auth.authoritativeItemConfidence
  ) {
    return { ok: false, reasonCode: 'D08_ITEM_GATE_NOT_MET' };
  }
  return { ok: true };
}

export function evidenceProvenanceFingerprintPayload(
  records: readonly Rule4D3D5EvidenceProvenanceRecord[],
): Record<string, unknown>[] {
  return [...records]
    .sort((a, b) => a.findingId.localeCompare(b.findingId))
    .map((r) => ({
      finding_id: r.findingId,
      document_id: r.documentId,
      item_gate_passed: r.itemGatePassed,
      document_gate_passed: r.documentGatePassed,
    }));
}

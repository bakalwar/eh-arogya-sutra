import type { Rule4EvidenceAdapterOutput } from '../evidence/types.js';
import type { Rule4GateResult } from '../eligibility/types.js';
import { rule4D3D5DiscriminatorFingerprintV1Hash } from './d3D5DiscriminatorFingerprintV1.js';
import {
  envelopeD08MatchesAuthoritative,
  envelopeEvidenceProvenanceMatchesAuthoritative,
  validateD3D5EvidenceProvenance,
} from './d3D5EvidenceProvenance.js';
import { RULE4_Q7BF_MANDATORY_GATE_ID_SET, RULE4_Q7BF_MANDATORY_GATE_IDS } from './q7bfGateIds.js';
import type {
  Rule4D3D5DiscriminatorEnvelope,
  Rule4D3D5SelectionRecord,
  Rule4FrozenDilution,
} from './types.js';

export type Rule4D3D5DiscriminatorValidationContext = {
  formulaSlotId: string;
  formulaTargetId: string;
  upstreamPhase7EligibilityFingerprint: string;
  evidenceAdapter?: Rule4EvidenceAdapterOutput | null;
  evidenceItems?: readonly import('../evidence/types.js').Rule4EvidenceItemEnvelope[] | null;
};

function q7bfLedgerPass(gates: readonly Rule4GateResult[]): { ok: boolean; code?: string } {
  const byId = new Map(gates.map((g) => [g.gateId, g]));
  for (const gateId of RULE4_Q7BF_MANDATORY_GATE_IDS) {
    const g = byId.get(gateId);
    if (!g) {
      return { ok: false, code: 'Q7BF_GATE_MISSING' };
    }
    if (g.outcome !== 'PASS') {
      return { ok: false, code: 'Q7BF_GATE_NOT_PASS' };
    }
  }
  for (const g of gates) {
    if (!RULE4_Q7BF_MANDATORY_GATE_ID_SET.has(g.gateId)) {
      return { ok: false, code: 'Q7BF_GATE_UNKNOWN' };
    }
  }
  return { ok: true };
}

function sensitivityCloseAligned(envelope: Rule4D3D5DiscriminatorEnvelope): boolean {
  const s = envelope.sensitivityAssessmentStatus;
  const c = envelope.closeD05DiscriminatorStatus;
  if (s === 'CONTRADICTORY' || c === 'CONTRADICTORY') {
    return false;
  }
  if (s === 'ASSESSED_D5_QUALIFIED') {
    return c === 'QUALIFIES_D5';
  }
  if (s === 'ASSESSED_D5_NOT_QUALIFIED') {
    return c === 'QUALIFIES_D3';
  }
  return false;
}

export function rejectLegacyD3D5SelectionRecord(
  legacy: Rule4D3D5SelectionRecord | null | undefined,
): string | null {
  if (!legacy) {
    return null;
  }
  return 'D3_D5_LEGACY_BOOLEAN_AUTHORITY_REJECTED';
}

export function validateD3D5DiscriminatorEnvelope(
  envelope: Rule4D3D5DiscriminatorEnvelope | null | undefined,
  ctx: Rule4D3D5DiscriminatorValidationContext,
): {
  status: 'resolved' | 'unresolved';
  dilution: Rule4FrozenDilution | null;
  reasonCodes: string[];
  discriminatorFingerprint: string | null;
} {
  const reasons: string[] = [];
  if (!envelope) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: ['D3_D5_DISCRIMINATOR_ENVELOPE_MISSING'],
      discriminatorFingerprint: null,
    };
  }

  if (
    envelope.formulaSlotId !== ctx.formulaSlotId ||
    envelope.formulaTargetId !== ctx.formulaTargetId
  ) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: ['D3_D5_ENVELOPE_BINDING_INVALID'],
      discriminatorFingerprint: null,
    };
  }

  if (envelope.upstreamPhase7EligibilityFingerprint !== ctx.upstreamPhase7EligibilityFingerprint) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: ['D3_D5_ENVELOPE_BINDING_INVALID'],
      discriminatorFingerprint: null,
    };
  }

  if (envelope.bindingStatus !== 'BOUND') {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: ['D3_D5_ENVELOPE_BINDING_INVALID'],
      discriminatorFingerprint: null,
    };
  }

  const q7 = q7bfLedgerPass(envelope.q7bfGateResults);
  if (!q7.ok) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: [q7.code!],
      discriminatorFingerprint: null,
    };
  }

  const provenance = validateD3D5EvidenceProvenance(envelope, ctx);
  if (!provenance.ok) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: [provenance.reasonCode!],
      discriminatorFingerprint: null,
    };
  }

  if (!envelope.evidenceProvenance?.length) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: ['D3_D5_EVIDENCE_PROVENANCE_MISSING'],
      discriminatorFingerprint: null,
    };
  }

  const d08Auth = envelopeD08MatchesAuthoritative(envelope, provenance);
  if (!d08Auth.ok) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: [d08Auth.reasonCode!],
      discriminatorFingerprint: null,
    };
  }

  const provBind = envelopeEvidenceProvenanceMatchesAuthoritative(envelope, provenance.records);
  if (!provBind.ok) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: [provBind.reasonCode!],
      discriminatorFingerprint: null,
    };
  }

  const expectedFp = rule4D3D5DiscriminatorFingerprintV1Hash(envelope);
  if (envelope.discriminatorFingerprint !== expectedFp) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: ['D3_D5_DISCRIMINATOR_FINGERPRINT_INVALID'],
      discriminatorFingerprint: null,
    };
  }

  const sens = envelope.sensitivityAssessmentStatus;
  if (
    sens === 'MISSING' ||
    sens === 'NOT_EVALUATED' ||
    sens === 'INVALID' ||
    sens === 'AMBIGUOUS' ||
    sens === 'CONTRADICTORY'
  ) {
    const code =
      sens === 'MISSING' || sens === 'NOT_EVALUATED'
        ? 'D3_D5_SENSITIVITY_MISSING'
        : 'D3_D5_SENSITIVITY_AMBIGUOUS';
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: [code],
      discriminatorFingerprint: expectedFp,
    };
  }

  if (
    envelope.closeD05DiscriminatorStatus === 'CONTRADICTORY' ||
    envelope.closeD05DiscriminatorStatus === 'UNRESOLVED' ||
    !sensitivityCloseAligned(envelope)
  ) {
    return {
      status: 'unresolved',
      dilution: null,
      reasonCodes: ['D3_D5_DISCRIMINATOR_CONTRADICTORY'],
      discriminatorFingerprint: expectedFp,
    };
  }

  if (sens === 'ASSESSED_D5_QUALIFIED' && envelope.closeD05DiscriminatorStatus === 'QUALIFIES_D5') {
    reasons.push('CLOSE_D05_QUALIFIES_D5');
    return {
      status: 'resolved',
      dilution: 'D5',
      reasonCodes: reasons,
      discriminatorFingerprint: expectedFp,
    };
  }

  if (
    sens === 'ASSESSED_D5_NOT_QUALIFIED' &&
    envelope.closeD05DiscriminatorStatus === 'QUALIFIES_D3'
  ) {
    reasons.push('CLOSE_D05_D3_PATH');
    return {
      status: 'resolved',
      dilution: 'D3',
      reasonCodes: reasons,
      discriminatorFingerprint: expectedFp,
    };
  }

  return {
    status: 'unresolved',
    dilution: null,
    reasonCodes: ['D3_D5_DISCRIMINATOR_UNRESOLVED'],
    discriminatorFingerprint: expectedFp,
  };
}

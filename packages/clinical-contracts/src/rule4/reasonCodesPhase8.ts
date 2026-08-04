import type { Rule4LimitationCodeEntry, Rule4ReasonCodeEntry } from './reasonCodes.js';

export const RULE4_PHASE8_REASON_CODE_REGISTRY: readonly Rule4ReasonCodeEntry[] = [
  {
    code: 'NUMERIC_SELECTION_SHADOW_DRAFT_ONLY',
    namespace: 'reason',
    source: 'Phase 8 boundary',
  },
  {
    code: 'SELECTION_NOT_PRESCRIPTION_ISSUANCE',
    namespace: 'reason',
    source: 'Phase 8 boundary',
  },
  {
    code: 'PRODUCTION_SELECTION_UPSTREAM_CHAIN_NOT_CONNECTED',
    namespace: 'reason',
    source: 'Phase 8 production boundary',
  },
  {
    code: 'SELECTION_UPSTREAM_ELIGIBILITY_MISSING',
    namespace: 'reason',
    source: 'Phase 8 upstream',
  },
  {
    code: 'SELECTION_UPSTREAM_ELIGIBILITY_FINGERPRINT_INVALID',
    namespace: 'reason',
    source: 'Phase 8 upstream',
  },
  {
    code: 'SELECTION_ELIGIBILITY_SLOT_MISSING',
    namespace: 'reason',
    source: 'Phase 8 upstream',
  },
  {
    code: 'SELECTION_RECORD_BINDING_MISSING',
    namespace: 'reason',
    source: 'Q15 isolation',
  },
  {
    code: 'CROSS_FORMULA_SELECTION_LEAKAGE_BLOCKED',
    namespace: 'reason',
    source: 'Q15 isolation',
  },
  {
    code: 'SELECTION_ENTRY_GATE_NOT_SATISFIED',
    namespace: 'reason',
    source: 'Phase 8 entry gate',
  },
  {
    code: 'SELECTION_INPUT_CONTRADICTORY',
    namespace: 'reason',
    source: 'Q8 multi-family fail closed',
  },
  {
    code: 'SELECTION_FAMILY_OPTIONS_EMPTY',
    namespace: 'reason',
    source: 'Phase 8',
  },
  {
    code: 'SYNTHETIC_SELECTION_BYPASS_REQUIRED',
    namespace: 'reason',
    source: 'Phase 8 synthetic boundary',
  },
  {
    code: 'TEMPERAMENT_TIE_UNRESOLVED',
    namespace: 'reason',
    source: 'Q8-G Q17',
  },
  {
    code: 'D3_D5_DISCRIMINATOR_ENVELOPE_MISSING',
    namespace: 'reason',
    source: 'Phase 8 D3/D5 envelope',
  },
  {
    code: 'D3_D5_DISCRIMINATOR_FINGERPRINT_INVALID',
    namespace: 'reason',
    source: 'Phase 8 D3/D5 fingerprint',
  },
  {
    code: 'D3_D5_LEGACY_BOOLEAN_AUTHORITY_REJECTED',
    namespace: 'reason',
    source: 'Phase 8 D3/D5 provenance',
  },
  {
    code: 'D3_D5_ENVELOPE_BINDING_INVALID',
    namespace: 'reason',
    source: 'Phase 8 D3/D5 binding',
  },
  {
    code: 'D3_D5_EVIDENCE_POOL_MISSING',
    namespace: 'reason',
    source: 'Phase 3 evidence pool',
  },
  {
    code: 'D3_D5_EVIDENCE_MEMBERSHIP_INVALID',
    namespace: 'reason',
    source: 'Phase 3 evidence membership',
  },
  {
    code: 'D3_D5_EVIDENCE_POOL_CONTRADICTORY',
    namespace: 'reason',
    source: 'Phase 3 evidence pool contradiction',
  },
  {
    code: 'D3_D5_EVIDENCE_ITEM_GATE_NOT_MET',
    namespace: 'reason',
    source: 'Phase 3 D04/D08 item gate',
  },
  {
    code: 'D3_D5_EVIDENCE_DOCUMENT_GATE_NOT_MET',
    namespace: 'reason',
    source: 'Phase 3 D08 document gate',
  },
  {
    code: 'D3_D5_EVIDENCE_DOCUMENT_BINDING_INVALID',
    namespace: 'reason',
    source: 'Phase 3 D08 document binding',
  },
  {
    code: 'D3_D5_EVIDENCE_PROVENANCE_MISSING',
    namespace: 'reason',
    source: 'Phase 8 D3/D5 provenance binding',
  },
  {
    code: 'D3_D5_EVIDENCE_PROVENANCE_MISMATCH',
    namespace: 'reason',
    source: 'Phase 8 D3/D5 provenance binding',
  },
  {
    code: 'Q7BF_GATE_MISSING',
    namespace: 'reason',
    source: 'Q7B-F',
  },
  {
    code: 'Q7BF_GATE_NOT_PASS',
    namespace: 'reason',
    source: 'Q7B-F',
  },
  {
    code: 'Q7BF_GATE_UNKNOWN',
    namespace: 'reason',
    source: 'Q7B-F',
  },
  {
    code: 'D08_DOCUMENT_GATE_NOT_MET',
    namespace: 'reason',
    source: 'D08',
  },
  {
    code: 'D08_ITEM_GATE_NOT_MET',
    namespace: 'reason',
    source: 'D08',
  },
  {
    code: 'D3_D5_SELECTION_RECORD_MISSING',
    namespace: 'reason',
    source: 'CLOSE-D05',
  },
  {
    code: 'D3_D5_DISCRIMINATOR_CONTRADICTORY',
    namespace: 'reason',
    source: 'CLOSE-D05',
  },
  {
    code: 'Q7BF_PRECONDITIONS_NOT_MET',
    namespace: 'reason',
    source: 'Q7B-F',
  },
  {
    code: 'D3_D5_SENSITIVITY_MISSING',
    namespace: 'reason',
    source: 'CLOSE-D05 Q7B-F',
  },
  {
    code: 'D3_D5_SENSITIVITY_AMBIGUOUS',
    namespace: 'reason',
    source: 'CLOSE-D05',
  },
  {
    code: 'D08_CONFIDENCE_GATE_NOT_MET',
    namespace: 'reason',
    source: 'CLOSE-D05 D08',
  },
  {
    code: 'CLOSE_D05_QUALIFIES_D5',
    namespace: 'reason',
    source: 'CLOSE-D05',
  },
  {
    code: 'CLOSE_D05_D3_PATH',
    namespace: 'reason',
    source: 'CLOSE-D05',
  },
  {
    code: 'D3_D5_DISCRIMINATOR_UNRESOLVED',
    namespace: 'reason',
    source: 'CLOSE-D05',
  },
  {
    code: 'D60_D10_FALLBACK_SELECTED',
    namespace: 'reason',
    source: 'D60 fallback',
  },
  {
    code: 'UNKNOWN_CANDIDATE_FAMILY',
    namespace: 'reason',
    source: 'Phase 8 fail closed',
  },
  {
    code: 'PEDIATRIC_D13_HS_BLOCKS_SELECTION',
    namespace: 'reason',
    source: 'D13-HS',
  },
  {
    code: 'VERIFIED_AGE_REQUIRED_FOR_SELECTION',
    namespace: 'reason',
    source: 'Phase 8 pediatric boundary',
  },
];

export const RULE4_PHASE8_LIMITATION_CODE_REGISTRY: readonly Rule4LimitationCodeEntry[] = [
  {
    code: 'SHADOW_DRAFT_NUMERIC_SELECTION_ONLY',
    namespace: 'limitation',
    source: 'Phase 8 shadow draft selection',
  },
  {
    code: 'TRUSTED_SYNTHETIC_SELECTION_BYPASS_TEST_ONLY',
    namespace: 'limitation',
    source: 'Phase 8 synthetic fixtures',
  },
];

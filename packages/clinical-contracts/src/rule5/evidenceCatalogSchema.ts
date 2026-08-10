/**
 * R5-M6B Track B CA-1 — metadata-only empty evidence catalog structural envelope.
 * Not runtime-connected; zero rows; no clinical authority.
 */

import { RULE5_MATRIX_EVIDENCE_GATE, RULE5_MATRIX_THRESHOLD_POLICY } from './hardBlockerMatrix.js';
import { RULE5_EVIDENCE_CATALOG_SCHEMA_KIND, RULE5_EVIDENCE_CATALOG_VERSION } from './version.js';

/** Immutable empty entries — no row/item type exists in CA-1. */
export type Rule5EmptyEvidenceCatalogEntries = readonly [];

export type Rule5EmptyEvidenceCatalogEnvelope = {
  schemaVersion: typeof RULE5_EVIDENCE_CATALOG_VERSION;
  schemaKind: typeof RULE5_EVIDENCE_CATALOG_SCHEMA_KIND;
  evidencePolicy: typeof RULE5_MATRIX_EVIDENCE_GATE;
  thresholdPolicy: typeof RULE5_MATRIX_THRESHOLD_POLICY;
  catalogRowCount: 0;
  entries: Rule5EmptyEvidenceCatalogEntries;
  implemented: false;
  connected: false;
  executable: false;
  affectsClinicalSelection: false;
  deterministicFingerprint: null;
};

function deepFreeze<T extends object>(value: T): T {
  Object.freeze(value);
  for (const v of Object.values(value)) {
    if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) {
      deepFreeze(v as object);
    }
  }
  return value;
}

export const RULE5_CANONICAL_EMPTY_EVIDENCE_CATALOG: Rule5EmptyEvidenceCatalogEnvelope = deepFreeze(
  {
    schemaVersion: RULE5_EVIDENCE_CATALOG_VERSION,
    schemaKind: RULE5_EVIDENCE_CATALOG_SCHEMA_KIND,
    evidencePolicy: RULE5_MATRIX_EVIDENCE_GATE,
    thresholdPolicy: RULE5_MATRIX_THRESHOLD_POLICY,
    catalogRowCount: 0,
    entries: Object.freeze([]) as Rule5EmptyEvidenceCatalogEntries,
    implemented: false,
    connected: false,
    executable: false,
    affectsClinicalSelection: false,
    deterministicFingerprint: null,
  },
);

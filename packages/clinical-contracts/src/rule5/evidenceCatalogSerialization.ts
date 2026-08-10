import { canonicalStableDumps } from '../rule4/canonicalJson.js';
import {
  RULE5_CANONICAL_EMPTY_EVIDENCE_CATALOG,
  type Rule5EmptyEvidenceCatalogEnvelope,
} from './evidenceCatalogSchema.js';

function normalizeEmptyEvidenceCatalog(
  doc: Rule5EmptyEvidenceCatalogEnvelope,
): Record<string, unknown> {
  return {
    affectsClinicalSelection: doc.affectsClinicalSelection,
    catalogRowCount: doc.catalogRowCount,
    connected: doc.connected,
    deterministicFingerprint: doc.deterministicFingerprint,
    entries: [...doc.entries],
    evidencePolicy: doc.evidencePolicy,
    executable: doc.executable,
    implemented: doc.implemented,
    schemaKind: doc.schemaKind,
    schemaVersion: doc.schemaVersion,
    thresholdPolicy: doc.thresholdPolicy,
  };
}

export function serializeRule5EmptyEvidenceCatalog(
  doc: Rule5EmptyEvidenceCatalogEnvelope = RULE5_CANONICAL_EMPTY_EVIDENCE_CATALOG,
): string {
  return canonicalStableDumps(normalizeEmptyEvidenceCatalog(doc));
}

import type {
  Rule4EvidenceAdapterInput,
  Rule4EvidenceItemEnvelope,
  Rule4ReportDocumentEnvelope,
  Rule4Rule3BindingPort,
} from '../../packages/clinical-contracts/src/rule4/evidence/types.js';
import {
  RULE4_CONTRACT_VERSION_PHASE3_EVIDENCE,
  RULE4_REGISTRY_PHASE3_VERSION,
  RULE4_RULESET_VERSION_DOC_BASELINE,
} from '../../packages/clinical-contracts/src/rule4/version.js';

export const EVIDENCE_SCENARIO_RULESET = RULE4_RULESET_VERSION_DOC_BASELINE;
export const EVIDENCE_SCENARIO_REGISTRY = RULE4_REGISTRY_PHASE3_VERSION;

export function basePort(overrides: Partial<Rule4Rule3BindingPort> = {}): Rule4Rule3BindingPort {
  return {
    formulaSlotId: 's1',
    portStatus: 'RESOLVED',
    formulaTargetId: 't-renal-1',
    organSystemKey: 'RENAL',
    anatomicalSite: 'kidney_cortex',
    pathologyId: 'path-stone-001',
    ...overrides,
  };
}

export function baseInput(
  partial: Partial<Rule4EvidenceAdapterInput> & {
    documents?: readonly Rule4ReportDocumentEnvelope[];
    items?: readonly Rule4EvidenceItemEnvelope[];
    rule3BindingPorts?: readonly Rule4Rule3BindingPort[];
  },
): Rule4EvidenceAdapterInput {
  return {
    contractVersion: RULE4_CONTRACT_VERSION_PHASE3_EVIDENCE,
    rulesetVersion: EVIDENCE_SCENARIO_RULESET,
    registryVersion: EVIDENCE_SCENARIO_REGISTRY,
    dataAssetVersion: 'synthetic-fixture-v1',
    label: 'SYNTHETIC',
    rule3BindingPorts: partial.rule3BindingPorts ?? [basePort()],
    documents: partial.documents ?? [],
    items: partial.items ?? [],
    ...partial,
  };
}

export function docTier1(id = 'doc-t1', parent = 'ps-t1'): Rule4ReportDocumentEnvelope {
  return {
    documentId: id,
    parentSourceId: parent,
    sourceType: 'DOCTOR_STRUCTURED_ENTRY',
    sourceReference: 'ref-structured-entry',
    timestampOrCaseContext: '2026-01-15T10:00:00Z',
  };
}

export function docTier2(
  integrity: number,
  id = 'doc-t2',
  parent = 'ps-t2',
): Rule4ReportDocumentEnvelope {
  return {
    documentId: id,
    parentSourceId: parent,
    sourceType: 'DIGITAL_STRUCTURED_REPORT',
    sourceReference: 'ref-digital-lims',
    timestampOrCaseContext: '2026-01-15T10:00:00Z',
    documentIntegrityScore: integrity,
    extractionModelDerived: false,
  };
}

export function docTier3(
  readability: number,
  id = 'doc-t3',
  parent = 'ps-t3',
): Rule4ReportDocumentEnvelope {
  return {
    documentId: id,
    parentSourceId: parent,
    sourceType: 'OCR_EXTRACTED_DOCUMENT_IMAGE',
    sourceReference: 'ref-ocr-scan',
    timestampOrCaseContext: '2026-01-15T10:00:00Z',
    documentReadabilityScore: readability,
    extractionModelDerived: true,
    modelCalibrationStatus: 'CALIBRATED_AND_VERIFIED',
  };
}

export function itemBase(
  findingId: string,
  doc: Rule4ReportDocumentEnvelope,
  overrides: Partial<Rule4EvidenceItemEnvelope> = {},
): Rule4EvidenceItemEnvelope {
  return {
    findingId,
    documentId: doc.documentId,
    parentSourceId: doc.parentSourceId,
    sourceType: doc.sourceType,
    sourceReference: doc.sourceReference,
    timestampOrCaseContext: doc.timestampOrCaseContext,
    formulaSlotId: 's1',
    formulaTargetId: 't-renal-1',
    targetOrganSystem: 'RENAL',
    anatomicalSite: 'kidney_cortex',
    targetPathologyId: 'path-stone-001',
    assertionStatus: 'PRESENT',
    verificationStatus: 'SUPPORTED',
    formulaRelevance: 'DIRECT',
    confidenceScore: 1.0,
    findingIdentityKey: `identity-${findingId}`,
    ...overrides,
  };
}

export type EvidenceScenarioSpec = {
  id: string;
  input: Rule4EvidenceAdapterInput;
  expected: {
    usableBySlot: Record<string, string[]>;
    contradictorySlots?: string[];
    documentGatePassed?: Record<string, boolean>;
    quarantineBlocked?: boolean;
    corroboratingParentCount?: Record<string, number>;
  };
};

export function buildEvidenceScenarios(): EvidenceScenarioSpec[] {
  const scenarios: EvidenceScenarioSpec[] = [];

  const push = (spec: EvidenceScenarioSpec) => scenarios.push(spec);

  // 1 Tier 1 valid
  {
    const d = docTier1();
    push({
      id: 'tier1-valid-direct',
      input: baseInput({ documents: [d], items: [itemBase('f1', d)] }),
      expected: { usableBySlot: { s1: ['f1'] } },
    });
  }

  // 2 Tier 2 valid
  {
    const d = docTier2(0.9);
    push({
      id: 'tier2-valid-doc-item',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f2', d, { confidenceScore: 0.91, sourceType: 'DIGITAL_STRUCTURED_REPORT' }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f2'] } },
    });
  }

  // 3 Tier 2 doc fail
  {
    const d = docTier2(0.84);
    push({
      id: 'tier2-document-fail',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f3', d, { confidenceScore: 0.95, sourceType: 'DIGITAL_STRUCTURED_REPORT' }),
        ],
      }),
      expected: { usableBySlot: { s1: [] }, documentGatePassed: { [d.documentId]: false } },
    });
  }

  // 4 Tier 2 sibling
  {
    const d = docTier2(0.9);
    push({
      id: 'tier2-one-item-fail-sibling-pass',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f4a', d, { confidenceScore: 0.89, sourceType: 'DIGITAL_STRUCTURED_REPORT' }),
          itemBase('f4b', d, { confidenceScore: 0.92, sourceType: 'DIGITAL_STRUCTURED_REPORT' }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f4b'] } },
    });
  }

  // 5 Tier 3 valid OCR
  {
    const d = docTier3(0.85);
    push({
      id: 'tier3-valid-ocr-item',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f5', d, {
            confidenceScore: 0.86,
            sourceType: 'OCR_EXTRACTED_DOCUMENT_IMAGE',
            extractionModelDerived: true,
            modelCalibrationStatus: 'CALIBRATED_AND_VERIFIED',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f5'] } },
    });
  }

  // 6 Tier 3 below confidence
  {
    const d = docTier3(0.85);
    push({
      id: 'tier3-below-item-confidence',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f6', d, {
            confidenceScore: 0.84,
            sourceType: 'OCR_EXTRACTED_DOCUMENT_IMAGE',
            extractionModelDerived: true,
            modelCalibrationStatus: 'CALIBRATED_AND_VERIFIED',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 7 unknown source on document
  {
    const d = {
      ...docTier1('doc-unknown'),
      sourceType: 'INVALID_SOURCE_XYZ' as Rule4ReportDocumentEnvelope['sourceType'],
    };
    push({
      id: 'unknown-source-type-document',
      input: baseInput({
        documents: [d],
        items: [itemBase('f7', d, { sourceType: d.sourceType })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 8 missing confidence tier2
  {
    const d = docTier2(0.9);
    push({
      id: 'missing-confidence-tier2',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f8', d, {
            confidenceScore: Number.NaN,
            sourceType: 'DIGITAL_STRUCTURED_REPORT',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 9 negated
  {
    const d = docTier1();
    push({
      id: 'negated-finding',
      input: baseInput({
        documents: [d],
        items: [itemBase('f9', d, { assertionStatus: 'NEGATED' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 10 suspected
  {
    const d = docTier1();
    push({
      id: 'suspected-finding',
      input: baseInput({
        documents: [d],
        items: [itemBase('f10', d, { assertionStatus: 'SUSPECTED' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 11 rule out
  {
    const d = docTier1();
    push({
      id: 'rule-out-finding',
      input: baseInput({
        documents: [d],
        items: [itemBase('f11', d, { assertionStatus: 'RULE_OUT' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 12 historical
  {
    const d = docTier1();
    push({
      id: 'historical-only-finding',
      input: baseInput({
        documents: [d],
        items: [itemBase('f12', d, { assertionStatus: 'HISTORICAL_ONLY' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 13 valid + invalid sibling
  {
    const d = docTier2(0.9);
    push({
      id: 'valid-item-invalid-sibling',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f13a', d, { confidenceScore: 0.92, sourceType: 'DIGITAL_STRUCTURED_REPORT' }),
          itemBase('f13b', d, {
            confidenceScore: 0.92,
            sourceType: 'DIGITAL_STRUCTURED_REPORT',
            anatomicalSite: 'wrong_site',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f13a'] } },
    });
  }

  // 14 duplicate same source
  {
    const d = docTier1();
    const a = itemBase('f14a', d, { findingIdentityKey: 'dup-key' });
    const b = itemBase('f14b', d, { findingIdentityKey: 'dup-key' });
    push({
      id: 'duplicate-same-parent-source',
      input: baseInput({ documents: [d], items: [a, b] }),
      expected: { usableBySlot: { s1: ['f14a'] } },
    });
  }

  // 15 duplicate upload (same parent)
  {
    const d1 = docTier1('doc-dup-a', 'parent-shared');
    const d2 = docTier1('doc-dup-b', 'parent-shared');
    push({
      id: 'duplicate-upload-shared-parent',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f15a', d1, { findingIdentityKey: 'lab-creat' }),
          itemBase('f15b', d2, { findingIdentityKey: 'lab-creat' }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f15a'] } },
    });
  }

  // 16 two independent corroborating
  {
    const d1 = docTier1('doc-corr-a', 'parent-a');
    const d2 = docTier1('doc-corr-b', 'parent-b');
    push({
      id: 'two-independent-corroborating',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f16a', d1, {
            findingIdentityKey: 'creatinine-high',
            timestampOrCaseContext: '2026-01-15T10:00:00Z',
            value: 1.4,
            unit: 'mg/dl',
            testPanelIdentity: 'panel-creat',
          }),
          itemBase('f16b', d2, {
            findingIdentityKey: 'creatinine-high',
            timestampOrCaseContext: '2026-01-15T10:00:00Z',
            value: 1.4,
            unit: 'mg/dl',
            testPanelIdentity: 'panel-creat',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f16a', 'f16b'] }, corroboratingParentCount: { s1: 2 } },
    });
  }

  // 17 two formulas one report
  {
    const d = docTier1('doc-multi');
    push({
      id: 'one-report-two-formula-slots',
      input: baseInput({
        rule3BindingPorts: [
          basePort(),
          basePort({
            formulaSlotId: 's2',
            formulaTargetId: 't-resp-1',
            organSystemKey: 'RESPIRATORY',
            anatomicalSite: 'lung_upper',
            pathologyId: 'path-pneum-001',
          }),
        ],
        documents: [d],
        items: [
          itemBase('f17a', d),
          itemBase('f17b', d, {
            formulaSlotId: 's2',
            formulaTargetId: 't-resp-1',
            targetOrganSystem: 'RESPIRATORY',
            anatomicalSite: 'lung_upper',
            targetPathologyId: 'path-pneum-001',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f17a'], s2: ['f17b'] } },
    });
  }

  // 18 cross formula leakage
  {
    const d = docTier1();
    push({
      id: 'cross-formula-leakage-attempt',
      input: baseInput({
        documents: [d],
        items: [itemBase('f18', d, { formulaSlotId: 's1', formulaTargetId: 't-wrong-target' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 19 missing binding port
  {
    const d = docTier1();
    push({
      id: 'missing-formula-binding-port',
      input: baseInput({ rule3BindingPorts: [], documents: [d], items: [itemBase('f19', d)] }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 20 organ mismatch
  {
    const d = docTier1();
    push({
      id: 'organ-system-mismatch',
      input: baseInput({
        documents: [d],
        items: [itemBase('f20', d, { targetOrganSystem: 'CARDIAC' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 21 site mismatch
  {
    const d = docTier1();
    push({
      id: 'anatomical-site-mismatch',
      input: baseInput({
        documents: [d],
        items: [itemBase('f21', d, { anatomicalSite: 'ureter' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 22 pathology mismatch
  {
    const d = docTier1();
    push({
      id: 'pathology-id-mismatch',
      input: baseInput({
        documents: [d],
        items: [itemBase('f22', d, { targetPathologyId: 'path-other' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 23 parent group blocked
  {
    const d = docTier1();
    push({
      id: 'pathology-parent-group-not-executable',
      input: baseInput({
        documents: [d],
        items: [itemBase('f23', d, { targetPathologyGroupId: 'group-parent' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 24 cross-parent supersession (different parent_source_id)
  {
    const d1 = docTier1('doc-old', 'p-super-old');
    const d2 = docTier1('doc-new', 'p-super-new');
    push({
      id: 'cross-parent-supersession-newer-wins',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f24old', d1, {
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
            testPanelIdentity: 'panel-a',
            value: 1.2,
            unit: 'mg/dl',
          }),
          itemBase('f24new', d2, {
            timestampOrCaseContext: '2026-02-01T00:00:00Z',
            testPanelIdentity: 'panel-a',
            value: 1.3,
            unit: 'mg/dl',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f24new'] }, corroboratingParentCount: { s1: 1 } },
    });
  }

  // 24b same-parent newer lineage (dedupe lineage, not cross-parent supersession)
  {
    const parent = 'p-super-lineage';
    const d1 = docTier1('doc-old', parent);
    const d2 = docTier1('doc-new', parent);
    push({
      id: 'same-parent-newer-lineage',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f24blold', d1, {
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
            testPanelIdentity: 'panel-lineage',
          }),
          itemBase('f24bnew', d2, {
            timestampOrCaseContext: '2026-02-01T00:00:00Z',
            testPanelIdentity: 'panel-lineage',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f24bnew'] } },
    });
  }

  // 25 invalid newer does not supersede
  {
    const d1 = docTier1('doc-old2', 'p-old2');
    const d2 = docTier1('doc-new2', 'p-new2');
    push({
      id: 'invalid-newer-does-not-supersede',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f25old', d1, {
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
            testPanelIdentity: 'panel-b',
          }),
          itemBase('f25new', d2, {
            timestampOrCaseContext: '2026-02-01T00:00:00Z',
            testPanelIdentity: 'panel-b',
            assertionStatus: 'NEGATED',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f25old'] } },
    });
  }

  // 26 contradiction
  {
    const d1 = docTier1('doc-c1', 'pc1');
    const d2 = docTier1('doc-c2', 'pc2');
    push({
      id: 'contradiction-same-binding',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f26a', d1, {
            testPanelIdentity: 'panel-c',
            value: 5,
            unit: 'mm',
            timestampOrCaseContext: '2026-01-11T00:00:00Z',
          }),
          itemBase('f26b', d2, {
            testPanelIdentity: 'panel-c',
            value: 8,
            unit: 'mm',
            timestampOrCaseContext: '2026-01-11T00:00:00Z',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f26a', 'f26b'] }, contradictorySlots: ['s1'] },
    });
  }

  // 27 global text quarantine
  {
    const d = docTier1();
    push({
      id: 'global-text-quarantine',
      input: baseInput({
        documents: [d],
        items: [itemBase('f27', d)],
        quarantineProbe: { global_text: true },
      }),
      expected: { usableBySlot: { s1: ['f27'] }, quarantineBlocked: true },
    });
  }

  // 28 116k supporting only
  {
    const d = {
      documentId: 'doc-116k',
      parentSourceId: 'p-116k',
      sourceType: 'DATASET_TAXONOMY_ALIGNMENT' as const,
      sourceReference: 'ref-116k',
      timestampOrCaseContext: '2026-01-15T10:00:00Z',
    };
    push({
      id: '116k-supporting-only',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f28', d, {
            sourceType: 'DATASET_TAXONOMY_ALIGNMENT',
            confidenceScore: 0.85,
            formulaRelevance: 'DIRECT',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 29 raw clinical photo
  {
    const d = {
      documentId: 'doc-photo',
      parentSourceId: 'p-photo',
      sourceType: 'CLINICAL_PHOTO_RAW' as const,
      sourceReference: 'ref-photo',
      timestampOrCaseContext: '2026-01-15T10:00:00Z',
    };
    push({
      id: 'raw-clinical-photo',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f29', d, {
            sourceType: 'CLINICAL_PHOTO_RAW',
            confidenceScore: 0.99,
          }),
        ],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 30 doctor structured photo observation
  {
    const d = {
      documentId: 'doc-photo-obs',
      parentSourceId: 'p-photo-obs',
      sourceType: 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION' as const,
      sourceReference: 'ref-photo-obs',
      timestampOrCaseContext: '2026-01-15T10:00:00Z',
    };
    push({
      id: 'doctor-structured-photo-observation',
      input: baseInput({
        documents: [d],
        items: [itemBase('f30', d, { sourceType: d.sourceType })],
      }),
      expected: { usableBySlot: { s1: ['f30'] } },
    });
  }

  // 31 empty document
  push({
    id: 'empty-document-no-items',
    input: baseInput({ documents: [], items: [] }),
    expected: { usableBySlot: { s1: [] } },
  });

  // 32 tier 2 boundary doc 0.85 item 0.90
  {
    const d = docTier2(0.85);
    push({
      id: 'tier2-boundary-thresholds',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f32', d, { confidenceScore: 0.9, sourceType: 'DIGITAL_STRUCTURED_REPORT' }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f32'] } },
    });
  }

  // 33 tier 4A candidate
  {
    const d = {
      documentId: 'doc-4a',
      parentSourceId: 'p-4a',
      sourceType: 'DOCTOR_FREE_TEXT_NLP_EXTRACTION' as const,
      sourceReference: 'ref-nlp',
      timestampOrCaseContext: '2026-01-15T10:00:00Z',
      extractionModelDerived: true,
      modelCalibrationStatus: 'CALIBRATED_AND_VERIFIED' as const,
    };
    push({
      id: 'tier4a-nlp-candidate-usable',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f33', d, {
            sourceType: 'DOCTOR_FREE_TEXT_NLP_EXTRACTION',
            confidenceScore: 0.81,
            extractionModelDerived: true,
            modelCalibrationStatus: 'CALIBRATED_AND_VERIFIED',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f33'] } },
    });
  }

  // 34 uncalibrated model
  {
    const d = docTier3(0.9);
    push({
      id: 'uncalibrated-model-blocked',
      input: baseInput({
        documents: [{ ...d, modelCalibrationStatus: 'NOT_CALIBRATED' }],
        items: [
          itemBase('f34', d, {
            sourceType: 'OCR_EXTRACTED_DOCUMENT_IMAGE',
            confidenceScore: 0.9,
            extractionModelDerived: true,
            modelCalibrationStatus: 'NOT_CALIBRATED',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 35 resolved assertion excluded
  {
    const d = docTier1();
    push({
      id: 'resolved-assertion-excluded',
      input: baseInput({
        documents: [d],
        items: [itemBase('f35', d, { assertionStatus: 'RESOLVED' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 36 unknown ambiguous
  {
    const d = docTier1();
    push({
      id: 'unknown-assertion-excluded',
      input: baseInput({
        documents: [d],
        items: [itemBase('f36', d, { assertionStatus: 'UNKNOWN' })],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 37 OCR/native same parent duplicate
  {
    const dNative = docTier2(0.9, 'doc-native', 'parent-ocr-dup');
    const dOcr = docTier3(0.85, 'doc-ocr', 'parent-ocr-dup');
    push({
      id: 'ocr-native-same-parent-duplicate',
      input: baseInput({
        documents: [dNative, dOcr],
        items: [
          itemBase('f37a', dNative, {
            sourceType: 'DIGITAL_STRUCTURED_REPORT',
            confidenceScore: 0.92,
            findingIdentityKey: 'same-lab',
          }),
          itemBase('f37b', dOcr, {
            sourceType: 'OCR_EXTRACTED_DOCUMENT_IMAGE',
            confidenceScore: 0.86,
            findingIdentityKey: 'same-lab',
            extractionModelDerived: true,
            modelCalibrationStatus: 'CALIBRATED_AND_VERIFIED',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f37a'] } },
    });
  }

  // 38 missing mandatory interpretation fields
  {
    const d = docTier1();
    push({
      id: 'missing-conditional-interpretation-fields',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f38', d, {
            requiresInterpretationFields: true,
            value: null,
            unit: null,
          }),
        ],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 39 registry nearest match quarantine
  {
    const d = docTier1();
    push({
      id: 'registry-nearest-match-quarantine',
      input: baseInput({
        documents: [d],
        items: [itemBase('f39', d)],
        quarantineProbe: { registry_nearest_match: true },
      }),
      expected: { usableBySlot: { s1: ['f39'] }, quarantineBlocked: true },
    });
  }

  // 40 port unresolved
  {
    const d = docTier1();
    push({
      id: 'rule3-port-unresolved',
      input: baseInput({
        rule3BindingPorts: [basePort({ portStatus: 'UNRESOLVED', pathologyId: null })],
        documents: [d],
        items: [itemBase('f40', d)],
      }),
      expected: { usableBySlot: { s1: [] } },
    });
  }

  // 41 distinct test identities both active
  {
    const d = docTier1();
    push({
      id: 'distinct-test-identities-both-active',
      input: baseInput({
        documents: [d],
        items: [
          itemBase('f41a', d, { testPanelIdentity: 'panel-x', findingIdentityKey: 'fx' }),
          itemBase('f41b', d, { testPanelIdentity: 'panel-y', findingIdentityKey: 'fy' }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f41a', 'f41b'] } },
    });
  }

  // 42 different laterality — no supersession
  {
    const d1 = docTier1('doc-lat-a', 'p-lat-a');
    const d2 = docTier1('doc-lat-b', 'p-lat-b');
    push({
      id: 'different-laterality-no-supersession',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f42a', d1, {
            testPanelIdentity: 'panel-lat',
            laterality: 'LEFT',
            timestampOrCaseContext: '2026-02-01T00:00:00Z',
          }),
          itemBase('f42b', d2, {
            testPanelIdentity: 'panel-lat',
            laterality: 'RIGHT',
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f42a', 'f42b'] } },
    });
  }

  // 43 different source tier — no supersession
  {
    const d1 = docTier1('doc-tier1', 'p-t1');
    const d2 = docTier2(0.9, 'doc-tier2', 'p-t2');
    push({
      id: 'different-source-tier-no-supersession',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f43a', d1, {
            testPanelIdentity: 'panel-tier',
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
          }),
          itemBase('f43b', d2, {
            sourceType: 'DIGITAL_STRUCTURED_REPORT',
            confidenceScore: 0.91,
            testPanelIdentity: 'panel-tier',
            timestampOrCaseContext: '2026-02-01T00:00:00Z',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f43a', 'f43b'] } },
    });
  }

  // 44 missing timestamp — no supersession among valid siblings
  {
    const d1 = docTier1('doc-ts-a', 'p-ts-a');
    const d2 = docTier1('doc-ts-b', 'p-ts-b');
    push({
      id: 'missing-timestamp-no-supersession',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f44old', d1, {
            testPanelIdentity: 'panel-ts',
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
          }),
          itemBase('f44bad', d2, {
            testPanelIdentity: 'panel-ts',
            timestampOrCaseContext: 'not-a-valid-iso-ts',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f44bad', 'f44old'] } },
    });
  }

  // 45 newer doctor entry does not supersede older photo observation
  {
    const dPhoto = docTier1('doc-photo-old', 'p-photo-old');
    const dEntry = docTier1('doc-entry-new', 'p-entry-new');
    dPhoto.sourceType = 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION';
    dEntry.sourceType = 'DOCTOR_STRUCTURED_ENTRY';
    push({
      id: 'doctor-entry-no-supersede-older-photo',
      input: baseInput({
        documents: [dPhoto, dEntry],
        items: [
          itemBase('f45photo', dPhoto, {
            sourceType: 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION',
            testPanelIdentity: 'panel-clin',
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
          }),
          itemBase('f45entry', dEntry, {
            sourceType: 'DOCTOR_STRUCTURED_ENTRY',
            testPanelIdentity: 'panel-clin',
            timestampOrCaseContext: '2026-02-01T00:00:00Z',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f45entry', 'f45photo'] } },
    });
  }

  // 46 newer photo does not supersede older doctor entry
  {
    const dEntry = docTier1('doc-entry-old', 'p-entry-old2');
    const dPhoto = docTier1('doc-photo-new', 'p-photo-new2');
    dEntry.sourceType = 'DOCTOR_STRUCTURED_ENTRY';
    dPhoto.sourceType = 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION';
    push({
      id: 'photo-no-supersede-older-entry',
      input: baseInput({
        documents: [dEntry, dPhoto],
        items: [
          itemBase('f46entry', dEntry, {
            sourceType: 'DOCTOR_STRUCTURED_ENTRY',
            testPanelIdentity: 'panel-clin2',
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
          }),
          itemBase('f46photo', dPhoto, {
            sourceType: 'DOCTOR_STRUCTURED_PHOTO_OBSERVATION',
            testPanelIdentity: 'panel-clin2',
            timestampOrCaseContext: '2026-02-01T00:00:00Z',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f46entry', 'f46photo'] } },
    });
  }

  // 47 same source type (entry) newer supersedes when identity matches
  {
    const d1 = docTier1('doc-e-old', 'p-e-old');
    const d2 = docTier1('doc-e-new', 'p-e-new');
    push({
      id: 'same-source-type-entry-newer-supersedes',
      input: baseInput({
        documents: [d1, d2],
        items: [
          itemBase('f47old', d1, {
            sourceType: 'DOCTOR_STRUCTURED_ENTRY',
            testPanelIdentity: 'panel-entry-line',
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
            value: 1.0,
            unit: 'mg/dl',
          }),
          itemBase('f47new', d2, {
            sourceType: 'DOCTOR_STRUCTURED_ENTRY',
            testPanelIdentity: 'panel-entry-line',
            timestampOrCaseContext: '2026-03-01T00:00:00Z',
            value: 1.1,
            unit: 'mg/dl',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f47new'] }, corroboratingParentCount: { s1: 1 } },
    });
  }

  // 48 two slots, two anatomical sites — both active (no cross-slot supersession)
  {
    const d = docTier1('doc-dual-site');
    push({
      id: 'different-anatomical-site-two-slots-active',
      input: baseInput({
        rule3BindingPorts: [
          basePort({ formulaSlotId: 's1', anatomicalSite: 'kidney_cortex' }),
          basePort({
            formulaSlotId: 's2',
            anatomicalSite: 'ureter',
            pathologyId: 'path-stone-001',
          }),
        ],
        documents: [d],
        items: [
          itemBase('f48cortex', d, {
            formulaSlotId: 's1',
            anatomicalSite: 'kidney_cortex',
            testPanelIdentity: 'panel-shared-stone',
            timestampOrCaseContext: '2026-02-01T00:00:00Z',
          }),
          itemBase('f48ureter', d, {
            formulaSlotId: 's2',
            anatomicalSite: 'ureter',
            testPanelIdentity: 'panel-shared-stone',
            timestampOrCaseContext: '2026-01-01T00:00:00Z',
          }),
        ],
      }),
      expected: { usableBySlot: { s1: ['f48cortex'], s2: ['f48ureter'] } },
    });
  }

  return scenarios;
}

/** Snake_case fixture rows for Python parity tests. */
export function toSnakeEvidenceInput(input: Rule4EvidenceAdapterInput): Record<string, unknown> {
  const mapPort = (p: Rule4Rule3BindingPort) => ({
    formula_slot_id: p.formulaSlotId,
    port_status: p.portStatus,
    formula_target_id: p.formulaTargetId,
    organ_system_key: p.organSystemKey,
    anatomical_site: p.anatomicalSite,
    pathology_id: p.pathologyId,
  });
  const mapDoc = (d: Rule4ReportDocumentEnvelope) => ({
    document_id: d.documentId,
    parent_source_id: d.parentSourceId,
    source_type: d.sourceType,
    source_reference: d.sourceReference,
    timestamp_or_case_context: d.timestampOrCaseContext,
    document_integrity_score: d.documentIntegrityScore ?? null,
    document_readability_score: d.documentReadabilityScore ?? null,
    extraction_model_derived: d.extractionModelDerived ?? null,
    model_calibration_status: d.modelCalibrationStatus ?? null,
  });
  const mapItem = (i: Rule4EvidenceItemEnvelope) => ({
    finding_id: i.findingId,
    document_id: i.documentId,
    parent_source_id: i.parentSourceId,
    source_type: i.sourceType,
    source_reference: i.sourceReference,
    timestamp_or_case_context: i.timestampOrCaseContext,
    formula_slot_id: i.formulaSlotId,
    formula_target_id: i.formulaTargetId,
    target_organ_system: i.targetOrganSystem,
    anatomical_site: i.anatomicalSite,
    target_pathology_id: i.targetPathologyId,
    target_pathology_group_id: i.targetPathologyGroupId ?? null,
    assertion_status: i.assertionStatus,
    verification_status: i.verificationStatus,
    formula_relevance: i.formulaRelevance,
    confidence_score: Number.isNaN(i.confidenceScore) ? null : i.confidenceScore,
    value: i.value ?? null,
    unit: i.unit ?? null,
    laterality: i.laterality ?? null,
    test_panel_identity: i.testPanelIdentity ?? null,
    finding_identity_key: i.findingIdentityKey ?? null,
    requires_interpretation_fields: i.requiresInterpretationFields ?? false,
    extraction_model_derived: i.extractionModelDerived ?? null,
    model_calibration_status: i.modelCalibrationStatus ?? null,
  });
  return {
    contract_version: input.contractVersion,
    ruleset_version: input.rulesetVersion,
    registry_version: input.registryVersion,
    data_asset_version: input.dataAssetVersion,
    label: input.label,
    rule3_binding_ports: input.rule3BindingPorts.map(mapPort),
    documents: input.documents.map(mapDoc),
    items: input.items.map(mapItem),
    quarantine_probe: input.quarantineProbe ?? null,
  };
}

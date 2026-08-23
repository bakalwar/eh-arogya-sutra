import { deepFreeze } from './freeze.js';
import type { Rule1PrimaryTemperament } from './constants.js';

export type Rule1ThermalAxis = 'HEAT' | 'COLD' | 'NONE';
export type Rule1EvidenceKind =
  'SYMPTOM' | 'SIGN' | 'CONTEXTUAL' | 'STRUCTURED_VITAL_BP' | 'STRUCTURED_VITAL_TEMP';

export type Rule1CatalogEntry = {
  readonly conceptId: string;
  readonly displayName: string;
  readonly temperament: Rule1PrimaryTemperament;
  readonly weight: 1 | 2 | 3;
  readonly maxContributions: number;
  readonly evidenceKind: Rule1EvidenceKind;
  readonly dedupeGroup: string;
  readonly thermalAxis: Rule1ThermalAxis;
  readonly isBpFeature: boolean;
  readonly countsAsIndependentConcept: boolean;
  readonly ownerFreezeToken: string;
};

const e = (
  conceptId: string,
  displayName: string,
  temperament: Rule1PrimaryTemperament,
  weight: 1 | 2 | 3,
  maxContributions: number,
  evidenceKind: Rule1EvidenceKind,
  dedupeGroup: string,
  thermalAxis: Rule1ThermalAxis,
  isBpFeature: boolean,
  ownerFreezeToken: string,
  countsAsIndependentConcept = true,
): Rule1CatalogEntry =>
  deepFreeze({
    conceptId,
    displayName,
    temperament,
    weight,
    maxContributions,
    evidenceKind,
    dedupeGroup,
    thermalAxis,
    isBpFeature,
    countsAsIndependentConcept,
    ownerFreezeToken,
  });

/**
 * Server-fixed owner-approved normalized feature catalog only.
 * No quarantined / R3-only / disease-label / raw-keyword scorers.
 */
export const RULE1_OWNER_APPROVED_FEATURE_CATALOG: readonly Rule1CatalogEntry[] = deepFreeze([
  // Bilious Batch 1
  e(
    'R1_FEAT_BILIOUS_GASTRIC_HYPERACIDITY',
    'Accepted gastric hyperacidity / dyspepsia',
    'BILIOUS',
    2,
    1,
    'SYMPTOM',
    'bilious_acidity',
    'NONE',
    false,
    'OWNER-FREEZE-R1-BILIOUS-BATCH1-v1',
  ),
  e(
    'R1_FEAT_BILIOUS_BILIARY_FLUID_CONTEXT',
    'Accepted biliary fluid / bilious vomitus context',
    'BILIOUS',
    1,
    1,
    'CONTEXTUAL',
    'bilious_bile_context',
    'NONE',
    false,
    'OWNER-FREEZE-R1-BILIOUS-BATCH1-v1',
  ),
  e(
    'R1_FEAT_BILIOUS_SCLERAL_CUTANEOUS_ICTERUS',
    'Scleral or cutaneous icterus sign',
    'BILIOUS',
    3,
    1,
    'SIGN',
    'bilious_icterus',
    'NONE',
    false,
    'OWNER-FREEZE-R1-BILIOUS-BATCH1-v1',
  ),
  e(
    'R1_FEAT_BILIOUS_HEPATIC_RUQ_PAIN',
    'Accepted hepatic / RUQ pain',
    'BILIOUS',
    2,
    1,
    'SYMPTOM',
    'bilious_hepatic_pain',
    'NONE',
    false,
    'OWNER-FREEZE-R1-BILIOUS-BATCH1-v1',
  ),

  // Sanguine Batch 2
  e(
    'R1_FEAT_SANGUINE_SITE_BOUND_BLEEDING_SYMPTOM',
    'Accepted site-bound bleeding symptom',
    'SANGUINE',
    2,
    1,
    'SYMPTOM',
    'sanguine_bleeding',
    'NONE',
    false,
    'OWNER-FREEZE-R1-SANGUINE-BATCH2-v1',
  ),
  e(
    'R1_FEAT_SANGUINE_OBJECTIVE_BLEEDING_SIGN',
    'Accepted objective bleeding sign',
    'SANGUINE',
    3,
    1,
    'SIGN',
    'sanguine_bleeding',
    'NONE',
    false,
    'OWNER-FREEZE-R1-SANGUINE-BATCH2-v1',
  ),
  e(
    'R1_FEAT_SANGUINE_PALPITATION',
    'Accepted current patient-specific palpitation',
    'SANGUINE',
    2,
    1,
    'SYMPTOM',
    'sanguine_palpitation',
    'NONE',
    false,
    'OWNER-FREEZE-R1-SANGUINE-BATCH2-v1',
  ),
  e(
    'R1_FEAT_SANGUINE_RESTING_TACHYCARDIA',
    'Validated measured resting tachycardia',
    'SANGUINE',
    3,
    1,
    'SIGN',
    'sanguine_tachycardia',
    'NONE',
    false,
    'OWNER-FREEZE-R1-SANGUINE-BATCH2-v1',
  ),
  e(
    'R1_FEAT_SANGUINE_FACIAL_FLUSHING',
    'Accepted facial / cutaneous flushing',
    'SANGUINE',
    2,
    1,
    'SIGN',
    'sanguine_flushing',
    'NONE',
    false,
    'OWNER-FREEZE-R1-SANGUINE-BATCH2-v1',
  ),
  e(
    'R1_FEAT_SANGUINE_SUBJECTIVE_HEAT_TENDENCY',
    'Accepted subjective heat tendency',
    'SANGUINE',
    1,
    1,
    'SYMPTOM',
    'sanguine_heat',
    'HEAT',
    false,
    'OWNER-FREEZE-R1-SANGUINE-BATCH2-v1',
  ),
  e(
    'R1_FEAT_SANGUINE_HEAT_INTOLERANCE_OR_HOT_SKIN',
    'Accepted heat intolerance or observed hot skin',
    'SANGUINE',
    2,
    1,
    'SYMPTOM',
    'sanguine_heat',
    'HEAT',
    false,
    'OWNER-FREEZE-R1-SANGUINE-BATCH2-v1',
  ),
  e(
    'R1_FEAT_SANGUINE_SYSTOLIC_BP_GE_140',
    'Validated structured systolic BP >= 140 mmHg',
    'SANGUINE',
    3,
    1,
    'STRUCTURED_VITAL_BP',
    'sanguine_bp',
    'NONE',
    true,
    'OWNER-FREEZE-R1-SANGUINE-BATCH2-v1',
  ),

  // Lymphatic Batch 3
  e(
    'R1_FEAT_LYMPHATIC_SUBJECTIVE_COLD_TENDENCY',
    'Accepted subjective cold tendency',
    'LYMPHATIC',
    1,
    1,
    'SYMPTOM',
    'lymphatic_cold',
    'COLD',
    false,
    'OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1',
  ),
  e(
    'R1_FEAT_LYMPHATIC_COLD_INTOLERANCE_OR_COLD_SKIN',
    'Accepted cold intolerance or observed cold skin',
    'LYMPHATIC',
    2,
    1,
    'SYMPTOM',
    'lymphatic_cold',
    'COLD',
    false,
    'OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1',
  ),
  e(
    'R1_FEAT_LYMPHATIC_MEASURED_HYPOTHERMIA',
    'Validated measured hypothermia / low body temperature (pre-validated concept; no invented °C threshold)',
    'LYMPHATIC',
    3,
    1,
    'SIGN',
    'lymphatic_hypothermia',
    'NONE',
    false,
    'OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1',
  ),
  e(
    'R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION',
    'Accepted current constipation',
    'LYMPHATIC',
    2,
    1,
    'SYMPTOM',
    'lymphatic_constipation',
    'NONE',
    false,
    'OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1',
  ),
  e(
    'R1_FEAT_LYMPHATIC_CHRONIC_CONSTIPATION_CONTEXT',
    'Contextual chronic / recurrent constipation',
    'LYMPHATIC',
    1,
    1,
    'CONTEXTUAL',
    'lymphatic_constipation_chronic',
    'NONE',
    false,
    'OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1',
  ),
  e(
    'R1_FEAT_LYMPHATIC_BODY_HABITUS_OBSERVATION',
    'Accepted clinician body-habitus observation',
    'LYMPHATIC',
    1,
    1,
    'SIGN',
    'lymphatic_habitus',
    'NONE',
    false,
    'OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1',
  ),
  e(
    'R1_FEAT_LYMPHATIC_SITE_BOUND_EDEMA',
    'Accepted site-bound edema / swelling',
    'LYMPHATIC',
    2,
    1,
    'SIGN',
    'lymphatic_edema',
    'NONE',
    false,
    'OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1',
  ),
  e(
    'R1_FEAT_LYMPHATIC_SITE_BOUND_PATHOLOGICAL_DISCHARGE',
    'Accepted site-bound pathological discharge',
    'LYMPHATIC',
    2,
    1,
    'SIGN',
    'lymphatic_discharge',
    'NONE',
    false,
    'OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1',
  ),
  e(
    'R1_FEAT_LYMPHATIC_SYSTOLIC_BP_LT_100',
    'Validated structured systolic BP < 100 mmHg',
    'LYMPHATIC',
    2,
    1,
    'STRUCTURED_VITAL_BP',
    'lymphatic_bp',
    'NONE',
    true,
    'OWNER-FREEZE-R1-LYMPHATIC-BATCH3-v1',
  ),

  // Nervous Batch 4 — exactly five weight-2 features
  e(
    'R1_FEAT_NERVOUS_CURRENT_ANXIETY',
    'Accepted current anxiety symptom',
    'NERVOUS',
    2,
    1,
    'SYMPTOM',
    'nervous_affective',
    'NONE',
    false,
    'OWNER-FREEZE-R1-NERVOUS-BATCH4-v1',
  ),
  e(
    'R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS',
    'Accepted current restlessness',
    'NERVOUS',
    2,
    1,
    'SYMPTOM',
    'nervous_affective',
    'NONE',
    false,
    'OWNER-FREEZE-R1-NERVOUS-BATCH4-v1',
  ),
  e(
    'R1_FEAT_NERVOUS_NEUROPATHIC_PAIN',
    'Accepted neuropathic / neuralgia-type pain',
    'NERVOUS',
    2,
    1,
    'SYMPTOM',
    'nervous_neuropathic_sensory',
    'NONE',
    false,
    'OWNER-FREEZE-R1-NERVOUS-BATCH4-v1',
  ),
  e(
    'R1_FEAT_NERVOUS_SITE_BOUND_SHOOTING_PAIN',
    'Accepted site-bound shooting pain',
    'NERVOUS',
    2,
    1,
    'SYMPTOM',
    'nervous_neuropathic_sensory',
    'NONE',
    false,
    'OWNER-FREEZE-R1-NERVOUS-BATCH4-v1',
  ),
  e(
    'R1_FEAT_NERVOUS_SITE_BOUND_PARESTHESIA',
    'Accepted current site-bound paresthesia / tingling',
    'NERVOUS',
    2,
    1,
    'SYMPTOM',
    'nervous_neuropathic_sensory',
    'NONE',
    false,
    'OWNER-FREEZE-R1-NERVOUS-BATCH4-v1',
  ),
]);

const BY_ID = new Map(RULE1_OWNER_APPROVED_FEATURE_CATALOG.map((c) => [c.conceptId, c]));

export function getCatalogEntry(conceptId: string): Rule1CatalogEntry | undefined {
  return BY_ID.get(conceptId);
}

export function catalogFingerprintMaterial(): string {
  return RULE1_OWNER_APPROVED_FEATURE_CATALOG.map(
    (c) =>
      `${c.conceptId}|${c.temperament}|${c.weight}|${c.maxContributions}|${c.thermalAxis}|${c.isBpFeature}|${c.ownerFreezeToken}`,
  ).join('\n');
}

export function countCatalogByTemperament(): Record<Rule1PrimaryTemperament, number> {
  const out: Record<Rule1PrimaryTemperament, number> = {
    BILIOUS: 0,
    SANGUINE: 0,
    LYMPHATIC: 0,
    NERVOUS: 0,
  };
  for (const c of RULE1_OWNER_APPROVED_FEATURE_CATALOG) {
    out[c.temperament] += 1;
  }
  return out;
}

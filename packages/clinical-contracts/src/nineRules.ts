/**
 * Nine-rule interfaces — Phase 5B.
 * Canonical names/order from Phase 5A EH_9 audit. No live orchestration.
 */

export const RULE_SET_VERSION = 'ehas2-nine-rule-interfaces-v2-rule5-monitoring' as const;

export type ClinicalRuleStatus =
  | 'NOT_CONNECTED'
  | 'NOT_IMPLEMENTED'
  | 'READY_FOR_VALIDATION'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'UNRESOLVED'
  | 'BLOCKED_BY_SAFETY'
  | 'BLOCKED_BY_POLICY_CONFLICT'
  | 'FAILED';

export type ClinicalRuleResult = {
  ruleNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  ruleName: string;
  status: ClinicalRuleStatus;
  evidence: readonly string[];
  confidence: number | null;
  warnings: readonly string[];
  unknownUnresolvedReason: string | null;
  sourceVersion: string;
  deterministicFingerprint: string | null;
  /** Clinical selection effect is deferred until orchestration is validated. */
  affectsClinicalSelection: boolean;
};

/** Canonical EH_9 names — do not invent. */
export const NINE_RULE_DEFINITIONS = [
  {
    ruleNumber: 1 as const,
    ruleName: 'Temperament (Prakriti)',
    phase5bStatus: 'READY_FOR_VALIDATION' as ClinicalRuleStatus,
    affectsClinicalSelection: true,
  },
  {
    ruleNumber: 2 as const,
    ruleName: 'Polarity',
    phase5bStatus: 'READY_FOR_VALIDATION' as ClinicalRuleStatus,
    affectsClinicalSelection: true,
  },
  {
    ruleNumber: 3 as const,
    ruleName: 'Organ / System Affinity',
    phase5bStatus: 'READY_FOR_VALIDATION' as ClinicalRuleStatus,
    affectsClinicalSelection: true,
  },
  {
    ruleNumber: 4 as const,
    ruleName: 'Potency',
    phase5bStatus: 'READY_FOR_VALIDATION' as ClinicalRuleStatus,
    affectsClinicalSelection: true,
  },
  {
    ruleNumber: 5 as const,
    ruleName: 'Monitoring, Follow-up & Post-Release Safety Surveillance',
    phase5bStatus: 'NOT_IMPLEMENTED' as ClinicalRuleStatus,
    affectsClinicalSelection: false,
  },
  {
    ruleNumber: 6 as const,
    ruleName: 'Multi-Disease / Organ-System Triad',
    phase5bStatus: 'READY_FOR_VALIDATION' as ClinicalRuleStatus,
    affectsClinicalSelection: true,
  },
  {
    ruleNumber: 7 as const,
    /** Owner-locked identity EXTERNAL_USE_ROUTES; shadow evaluator only — not production-connected. */
    ruleName: 'External Use Routes',
    phase5bStatus: 'READY_FOR_VALIDATION' as ClinicalRuleStatus,
    affectsClinicalSelection: false,
  },
  {
    ruleNumber: 8 as const,
    /** Owner-locked identity DISEASE_LEVEL_PRAKRUTI_INFERENCE; shadow evaluator only — not production-connected. */
    ruleName: 'Disease-level Prakruti Inference',
    phase5bStatus: 'READY_FOR_VALIDATION' as ClinicalRuleStatus,
    affectsClinicalSelection: false,
  },
  {
    ruleNumber: 9 as const,
    /** Owner-locked identity MASTER_PIPELINE; shadow validator/packager only — not production-connected. */
    ruleName: 'Master Pipeline',
    phase5bStatus: 'READY_FOR_VALIDATION' as ClinicalRuleStatus,
    affectsClinicalSelection: false,
  },
] as const;

export function createRuleInterfaceResult(
  def: (typeof NINE_RULE_DEFINITIONS)[number],
): ClinicalRuleResult {
  return {
    ruleNumber: def.ruleNumber,
    ruleName: def.ruleName,
    status: def.phase5bStatus,
    evidence: [],
    confidence: null,
    warnings:
      def.phase5bStatus === 'NOT_IMPLEMENTED'
        ? ['Historically unwired on legacy live path; not falsely marked implemented']
        : [],
    unknownUnresolvedReason:
      def.phase5bStatus === 'UNRESOLVED' || def.phase5bStatus === 'NOT_IMPLEMENTED'
        ? def.phase5bStatus
        : null,
    sourceVersion: RULE_SET_VERSION,
    deterministicFingerprint: null,
    affectsClinicalSelection: def.affectsClinicalSelection,
  };
}

export function allNineRuleInterfaceResults(): readonly ClinicalRuleResult[] {
  return NINE_RULE_DEFINITIONS.map(createRuleInterfaceResult);
}

export const ORCHESTRATION_STATUS = 'NOT_CONNECTED' as const;
/** Synthetic validation orchestrator only — does not enable production AnalyzeComplete. */
export const VALIDATION_ORCHESTRATION_STATUS = 'READY_FOR_VALIDATION' as const;
export const PRESCRIPTION_ENGINE_STATUS = 'PRESCRIPTION_ENGINE_NOT_CONNECTED' as const;
export const TABLET_ENGINE_STATUS = 'NOT_IMPLEMENTED' as const;
export const TABLET_FULL_POOL_REGISTRY_STATUS = 'AVAILABLE' as const;
export const TABLET_SELECTION_STATUS = 'DEFERRED_TO_CONTROLLED_RECONSTRUCTION' as const;

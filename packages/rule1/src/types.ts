import type {
  Rule1MixedSubtype,
  Rule1PrimaryTemperament,
  Rule1ProfileStatus,
} from './constants.js';
import {
  RULE1_INPUT_SCHEMA_VERSION,
  RULE1_OUTPUT_CONTRACT_VERSION,
  RULE1_PERCENTAGE_ALGORITHM,
  RULE1_RULE_CONTRACT_VERSION,
} from './version.js';

export type Rule1TemporalPosture = 'CURRENT' | 'HISTORICAL';
export type Rule1NegationPosture = 'ASSERTED' | 'NEGATED';
export type Rule1AcceptancePosture = 'ACCEPTED' | 'UNACCEPTED';

export type Rule1EvidenceBinding = {
  readonly conceptId: string;
  readonly sourceFactFingerprint: string;
  readonly temporalPosture: Rule1TemporalPosture;
  readonly negationPosture: Rule1NegationPosture;
  readonly acceptancePosture: Rule1AcceptancePosture;
};

export type Rule1SystolicBpVital = {
  readonly value: number;
  readonly unit: 'mmHg';
  readonly validationPosture: 'VALIDATED' | 'INVALID';
};

export type Rule1StructuredVitals = {
  readonly systolicBpMmHg?: Rule1SystolicBpVital;
};

export type Rule1Input = {
  readonly inputSchemaVersion: typeof RULE1_INPUT_SCHEMA_VERSION;
  readonly ruleContractVersion: typeof RULE1_RULE_CONTRACT_VERSION;
  readonly consultationId: string;
  readonly episodeId: string;
  readonly evidence: readonly Rule1EvidenceBinding[];
  readonly structuredVitals?: Rule1StructuredVitals;
};

export type Rule1ScoreMap = {
  readonly BILIOUS: number;
  readonly SANGUINE: number;
  readonly LYMPHATIC: number;
  readonly NERVOUS: number;
};

export type Rule1PercentageMap = {
  readonly BILIOUS: number;
  readonly SANGUINE: number;
  readonly LYMPHATIC: number;
  readonly NERVOUS: number;
};

export type Rule1RankedPercentageEntry = {
  readonly temperament: Rule1PrimaryTemperament;
  readonly percentage: number;
  readonly score: number;
};

export type Rule1AcceptedContribution = {
  readonly conceptId: string;
  readonly sourceFactFingerprint: string;
  readonly temperament: Rule1PrimaryTemperament;
  readonly weight: number;
  readonly reasonCode: string;
};

export type Rule1ExcludedEvidence = {
  readonly conceptId: string;
  readonly sourceFactFingerprint: string;
  readonly reasonCode: string;
};

export type Rule1Output = {
  readonly inputSchemaVersion: typeof RULE1_INPUT_SCHEMA_VERSION;
  readonly ruleContractVersion: typeof RULE1_RULE_CONTRACT_VERSION;
  readonly outputSchemaVersion: typeof RULE1_OUTPUT_CONTRACT_VERSION;
  readonly percentageAlgorithm: typeof RULE1_PERCENTAGE_ALGORITHM;
  readonly catalogVersion: string;
  readonly scoringAlgorithmVersion: string;
  readonly catalogFingerprint: string;
  readonly inputFingerprint: string;
  readonly status: Rule1ProfileStatus;
  readonly mixedSubtype: Rule1MixedSubtype | null;
  readonly primaryTemperament: Rule1PrimaryTemperament | null;
  readonly dominantTemperaments: readonly Rule1PrimaryTemperament[] | null;
  readonly scores: Rule1ScoreMap;
  readonly percentages: Rule1PercentageMap | null;
  readonly rankedPercentageProfile: readonly Rule1RankedPercentageEntry[] | null;
  readonly acceptedContributions: readonly Rule1AcceptedContribution[];
  readonly excludedEvidence: readonly Rule1ExcludedEvidence[];
  readonly reasonCodes: readonly string[];
  readonly clinicallyUsed: false;
  readonly shadowOnly: true;
  readonly clinicalActivation: 'NONE';
  readonly medicineSelectionInfluence: 'NONE';
  readonly prescriptionEffect: 'NONE';
  readonly orchestrationStatus: 'NOT_CONNECTED';
  readonly runtimeStatus: 'NOT_CONNECTED';
};

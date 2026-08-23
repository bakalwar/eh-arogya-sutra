import {
  MAX_EVIDENCE_COUNT,
  MAX_SYNTHETIC_ID_LENGTH,
  RULE1_EVIDENCE_KEY_ORDER,
  RULE1_INPUT_KEY_ORDER,
} from './constants.js';
import { Rule1EvaluationError } from './errors.js';
import { assertNfc } from './fingerprint.js';
import { RULE1_INPUT_SCHEMA_VERSION, RULE1_RULE_CONTRACT_VERSION } from './version.js';
import type {
  Rule1AcceptancePosture,
  Rule1EvidenceBinding,
  Rule1Input,
  Rule1NegationPosture,
  Rule1StructuredVitals,
  Rule1TemporalPosture,
} from './types.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
  );
}

function assertExactKeys(
  obj: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const keys = Object.keys(obj).sort();
  const allow = [...allowed].sort();
  for (const k of keys) {
    if (!allowed.includes(k)) {
      if (k === 'weight' || k === 'temperament' || k === 'temperamentToken') {
        throw new Rule1EvaluationError(
          'CALLER_SUPPLIED_WEIGHT_OR_TEMPERAMENT',
          `${label}: caller-supplied ${k} forbidden`,
        );
      }
      if (
        /text|keyword|prose|span|chiefComplaint|raw/i.test(k) ||
        k === 'rawText' ||
        k === 'freeText'
      ) {
        throw new Rule1EvaluationError(
          'RAW_TEXT_FORBIDDEN',
          `${label}: raw/text field ${k} forbidden`,
        );
      }
      throw new Rule1EvaluationError('INVALID_INPUT', `${label}: unknown key ${k}`);
    }
  }
  for (const a of allow) {
    if (a === 'structuredVitals') continue;
    if (!(a in obj)) {
      throw new Rule1EvaluationError('INVALID_INPUT', `${label}: missing key ${a}`);
    }
  }
}

function assertSyntheticId(raw: unknown, label: string): string {
  const id = assertNfc(String(raw), label);
  if (id.length > MAX_SYNTHETIC_ID_LENGTH) {
    throw new Rule1EvaluationError('INVALID_INPUT', `${label} exceeds maximum length`);
  }
  return id;
}

function parseEvidence(raw: unknown): Rule1EvidenceBinding {
  if (!isPlainObject(raw)) {
    throw new Rule1EvaluationError('INVALID_INPUT', 'evidence entry must be plain object');
  }
  assertExactKeys(raw, RULE1_EVIDENCE_KEY_ORDER, 'evidence');
  const conceptId = assertNfc(String(raw.conceptId), 'conceptId');
  const sourceFactFingerprint = assertNfc(
    String(raw.sourceFactFingerprint),
    'sourceFactFingerprint',
  );
  if (!/^[A-Za-z0-9:_.=+-]+$/.test(sourceFactFingerprint) || sourceFactFingerprint.length > 128) {
    throw new Rule1EvaluationError('MALFORMED_FINGERPRINT', 'sourceFactFingerprint malformed');
  }
  const temporalPosture = raw.temporalPosture as Rule1TemporalPosture;
  const negationPosture = raw.negationPosture as Rule1NegationPosture;
  const acceptancePosture = raw.acceptancePosture as Rule1AcceptancePosture;
  if (temporalPosture !== 'CURRENT' && temporalPosture !== 'HISTORICAL') {
    throw new Rule1EvaluationError('INVALID_INPUT', 'temporalPosture invalid');
  }
  if (negationPosture !== 'ASSERTED' && negationPosture !== 'NEGATED') {
    throw new Rule1EvaluationError('INVALID_INPUT', 'negationPosture invalid');
  }
  if (acceptancePosture !== 'ACCEPTED' && acceptancePosture !== 'UNACCEPTED') {
    throw new Rule1EvaluationError('INVALID_INPUT', 'acceptancePosture invalid');
  }
  return {
    conceptId,
    sourceFactFingerprint,
    temporalPosture,
    negationPosture,
    acceptancePosture,
  };
}

function parseVitals(raw: unknown): Rule1StructuredVitals | undefined {
  if (raw === undefined) return undefined;
  if (!isPlainObject(raw)) {
    throw new Rule1EvaluationError('INVALID_INPUT', 'structuredVitals must be plain object');
  }
  const keys = Object.keys(raw);
  for (const k of keys) {
    if (k !== 'systolicBpMmHg') {
      throw new Rule1EvaluationError('INVALID_INPUT', `structuredVitals unknown key ${k}`);
    }
  }
  if (!('systolicBpMmHg' in raw)) return {};
  const bp = raw.systolicBpMmHg;
  if (!isPlainObject(bp)) {
    throw new Rule1EvaluationError('MALFORMED_VITAL', 'systolicBpMmHg malformed');
  }
  for (const k of Object.keys(bp)) {
    if (!['value', 'unit', 'validationPosture'].includes(k)) {
      throw new Rule1EvaluationError('MALFORMED_VITAL', `bp unknown key ${k}`);
    }
  }
  if (typeof bp.value !== 'number') {
    throw new Rule1EvaluationError('MALFORMED_VITAL', 'bp value must be finite number');
  }
  if (!Number.isFinite(bp.value) || bp.value <= 0) {
    throw new Rule1EvaluationError('MALFORMED_VITAL', 'bp value must be finite number');
  }
  if (bp.unit !== 'mmHg') {
    throw new Rule1EvaluationError('MALFORMED_VITAL', 'bp unit must be mmHg');
  }
  if (bp.validationPosture !== 'VALIDATED' && bp.validationPosture !== 'INVALID') {
    throw new Rule1EvaluationError('MALFORMED_VITAL', 'bp validationPosture invalid');
  }
  return {
    systolicBpMmHg: {
      value: bp.value,
      unit: 'mmHg',
      validationPosture: bp.validationPosture,
    },
  };
}

export function validateRule1Input(raw: unknown): Rule1Input {
  if (!isPlainObject(raw)) {
    throw new Rule1EvaluationError('INVALID_INPUT', 'input must be plain object');
  }
  assertExactKeys(raw, RULE1_INPUT_KEY_ORDER, 'input');

  if (raw.inputSchemaVersion !== RULE1_INPUT_SCHEMA_VERSION) {
    throw new Rule1EvaluationError('UNSUPPORTED_CONTRACT_VERSION', 'inputSchemaVersion mismatch');
  }
  if (raw.ruleContractVersion !== RULE1_RULE_CONTRACT_VERSION) {
    throw new Rule1EvaluationError('UNSUPPORTED_CONTRACT_VERSION', 'ruleContractVersion mismatch');
  }

  const consultationId = assertSyntheticId(raw.consultationId, 'consultationId');
  const episodeId = assertSyntheticId(raw.episodeId, 'episodeId');
  if (!Array.isArray(raw.evidence)) {
    throw new Rule1EvaluationError('INVALID_INPUT', 'evidence must be array');
  }
  if (raw.evidence.length > MAX_EVIDENCE_COUNT) {
    throw new Rule1EvaluationError('INVALID_INPUT', 'evidence exceeds maximum count');
  }
  const evidence = raw.evidence.map(parseEvidence);
  const structuredVitals = parseVitals(raw.structuredVitals);

  return {
    inputSchemaVersion: RULE1_INPUT_SCHEMA_VERSION,
    ruleContractVersion: RULE1_RULE_CONTRACT_VERSION,
    consultationId,
    episodeId,
    evidence,
    ...(structuredVitals !== undefined ? { structuredVitals } : {}),
  };
}

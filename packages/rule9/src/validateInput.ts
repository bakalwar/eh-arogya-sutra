import { types } from 'node:util';
import {
  RULE9_APPLICABILITY_STATES,
  RULE9_COMPLEXITY_APPROVAL_TOKEN,
  RULE9_COMPLEXITY_APPROVED_KEY_ORDER,
  RULE9_COMPLEXITY_NONSUCCESS_STATUSES,
  RULE9_COMPLEXITY_TIERS,
  RULE9_ENVELOPE_ABSENT_STATUSES,
  RULE9_INPUT_KEY_ORDER,
  RULE9_MIXTURE_KEY_ORDER,
  RULE9_RULE_IDENTITIES,
} from './constants.js';
import { Rule9EvaluationError } from './errors.js';
import { canonicalCloneJson } from './freeze.js';
import type {
  Rule9ComplexityTierRef,
  Rule9EvidenceDataVersions,
  Rule9Input,
  Rule9OralMixture,
  Rule9ProposedOralComposition,
  Rule9RuleEnvelope,
  Rule9UpstreamApplicability,
} from './types.js';
import { RULE9_INPUT_CONTRACT_VERSION } from './version.js';

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PHI_KEY_RE = /^(patientName|patient_name|fullName|phone|email|address|ssn|mrn)$/i;
const FORBIDDEN_COMPOSITION_KEYS = new Set([
  'tabletA',
  'tabletB',
  'tablet_a',
  'tablet_b',
  'externalApplications',
  'external_applications',
  'plusOne',
  '+1',
  'oralPlusOne',
  'filler',
  'fallbackMedicine',
  'potency',
  'dosage',
  'electricity',
  'monitoringPlan',
  'finalRx',
  'prescriptionEffect',
]);

type FailFn = () => never;

function failInput(): never {
  throw new Rule9EvaluationError('INVALID_INPUT');
}

function failVersion(): never {
  throw new Rule9EvaluationError('UNSUPPORTED_CONTRACT_VERSION');
}

function failEnvelope(): never {
  throw new Rule9EvaluationError('INVALID_UPSTREAM_ENVELOPE');
}

function failContradictory(): never {
  throw new Rule9EvaluationError('CONTRADICTORY_UPSTREAM_STATE');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (types.isProxy(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function assertNoAccessors(value: object, fail: FailFn): void {
  for (const key of Reflect.ownKeys(value)) {
    const desc = Object.getOwnPropertyDescriptor(value, key);
    if (!desc) fail();
    if (typeof desc.get === 'function' || typeof desc.set === 'function') fail();
    if (typeof key === 'symbol') fail();
  }
}

function assertDenseArray(value: unknown[], fail: FailFn): void {
  for (let i = 0; i < value.length; i += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, i)) fail();
  }
}

function assertPlainData(value: unknown, seen: WeakSet<object>, fail: FailFn): void {
  if (value === null) return;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') {
    if (t === 'number' && !Number.isFinite(value as number)) fail();
    return;
  }
  if (t === 'function' || t === 'symbol' || t === 'bigint' || t === 'undefined') fail();
  if (typeof value !== 'object') fail();
  if (types.isProxy(value)) fail();
  if (seen.has(value as object)) fail();
  seen.add(value as object);
  if (Array.isArray(value)) {
    assertDenseArray(value, fail);
    for (const item of value) assertPlainData(item, seen, fail);
    return;
  }
  if (!isPlainObject(value)) fail();
  assertNoAccessors(value, fail);
  for (const key of Object.keys(value)) {
    if (PHI_KEY_RE.test(key)) fail();
    assertPlainData(value[key], seen, fail);
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  order: readonly string[],
  fail: FailFn,
): void {
  const keys = Object.keys(value);
  if (keys.length !== order.length) fail();
  const set = new Set(order);
  for (const k of keys) {
    if (!set.has(k)) fail();
  }
}

function assertId(value: unknown, fail: FailFn): string {
  if (typeof value !== 'string' || !ID_RE.test(value)) fail();
  return value;
}

function assertStringArray(value: unknown, fail: FailFn): string[] {
  if (!Array.isArray(value)) fail();
  assertDenseArray(value, fail);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const id = assertId(item, fail);
    if (seen.has(id)) fail();
    seen.add(id);
    out.push(id);
  }
  return out;
}

function parseComplexityTierRef(raw: unknown): Rule9ComplexityTierRef {
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  if ('status' in raw && Object.keys(raw).length === 1) {
    const status = raw.status;
    if (
      typeof status !== 'string' ||
      !(RULE9_COMPLEXITY_NONSUCCESS_STATUSES as readonly string[]).includes(status)
    ) {
      failInput();
    }
    return {
      status: status as 'UNAVAILABLE' | 'UNAPPROVED' | 'CONTRADICTORY' | 'STALE',
    };
  }
  assertExactKeys(raw, RULE9_COMPLEXITY_APPROVED_KEY_ORDER, failInput);
  const tier = raw.tier;
  if (typeof tier !== 'string' || !(RULE9_COMPLEXITY_TIERS as readonly string[]).includes(tier)) {
    failInput();
  }
  if (raw.ownerApprovalStatus !== RULE9_COMPLEXITY_APPROVAL_TOKEN) failInput();
  return {
    tier: tier as (typeof RULE9_COMPLEXITY_TIERS)[number],
    ownerApprovalStatus: RULE9_COMPLEXITY_APPROVAL_TOKEN,
    evidenceSourceId: assertId(raw.evidenceSourceId, failInput),
    version: assertId(raw.version, failInput),
  };
}

function parseRuleEnvelope(
  raw: unknown,
  expectedNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
): Rule9RuleEnvelope {
  if (!isPlainObject(raw)) failEnvelope();
  assertNoAccessors(raw, failEnvelope);
  if ('status' in raw && Object.keys(raw).length === 1) {
    const status = raw.status;
    if (
      typeof status !== 'string' ||
      !(RULE9_ENVELOPE_ABSENT_STATUSES as readonly string[]).includes(status)
    ) {
      failEnvelope();
    }
    if (status === 'NOT_IMPLEMENTED' && expectedNumber !== 5) failEnvelope();
    return { status: status as 'UNAVAILABLE' | 'NOT_IMPLEMENTED' };
  }

  const requiresCount = expectedNumber >= 6;
  const expectedKeys = requiresCount
    ? ([
        'ruleNumber',
        'ruleIdentity',
        'contractVersion',
        'status',
        'applicability',
        'validatedActiveClinicalDataCount',
      ] as const)
    : (['ruleNumber', 'ruleIdentity', 'contractVersion', 'status', 'applicability'] as const);
  assertExactKeys(raw, expectedKeys, failEnvelope);
  if (raw.ruleNumber !== expectedNumber) failEnvelope();
  if (raw.ruleIdentity !== RULE9_RULE_IDENTITIES[expectedNumber]) failEnvelope();
  if (typeof raw.contractVersion !== 'string' || !ID_RE.test(raw.contractVersion)) failEnvelope();
  if (typeof raw.status !== 'string' || raw.status.length === 0 || raw.status.length > 128) {
    failEnvelope();
  }
  if (
    typeof raw.applicability !== 'string' ||
    !(RULE9_APPLICABILITY_STATES as readonly string[]).includes(raw.applicability)
  ) {
    failEnvelope();
  }
  if (
    raw.status === 'CONFLICT' ||
    raw.status === 'CONTRADICTORY' ||
    raw.applicability === ('CONTRADICTORY' as string)
  ) {
    failContradictory();
  }

  const base = {
    ruleNumber: expectedNumber,
    ruleIdentity: RULE9_RULE_IDENTITIES[expectedNumber],
    contractVersion: raw.contractVersion,
    status: raw.status,
    applicability: raw.applicability as (typeof RULE9_APPLICABILITY_STATES)[number],
  };

  if (requiresCount) {
    const count = raw.validatedActiveClinicalDataCount;
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) failEnvelope();
    return { ...base, validatedActiveClinicalDataCount: count };
  }
  return base;
}

function parseMixture(raw: unknown): Rule9OralMixture {
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  for (const k of Object.keys(raw)) {
    if (FORBIDDEN_COMPOSITION_KEYS.has(k)) failInput();
  }
  assertExactKeys(raw, RULE9_MIXTURE_KEY_ORDER, failInput);
  const medicineIds = assertStringArray(raw.medicineIds, failInput);
  if (medicineIds.length === 0) failInput();
  return {
    mixtureId: assertId(raw.mixtureId, failInput),
    medicineIds: Object.freeze(medicineIds),
    evidenceRefs: Object.freeze(assertStringArray(raw.evidenceRefs, failInput)),
  };
}

function parseProposedOralComposition(raw: unknown): Rule9ProposedOralComposition {
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  for (const k of Object.keys(raw)) {
    if (FORBIDDEN_COMPOSITION_KEYS.has(k)) failInput();
  }
  if ('status' in raw && Object.keys(raw).length === 1) {
    if (raw.status !== 'ABSENT') failInput();
    return { status: 'ABSENT' };
  }
  if (!('mixtures' in raw) || Object.keys(raw).length !== 1) failInput();
  if (!Array.isArray(raw.mixtures)) failInput();
  assertDenseArray(raw.mixtures, failInput);
  const mixtures = raw.mixtures.map(parseMixture);
  const ids = new Set<string>();
  for (const m of mixtures) {
    if (ids.has(m.mixtureId)) failInput();
    ids.add(m.mixtureId);
  }
  return { mixtures: Object.freeze(mixtures) };
}

function parseEvidenceDataVersions(raw: unknown): Rule9EvidenceDataVersions {
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  assertExactKeys(raw, ['pipelineDataVersion', 'contractVersion'], failInput);
  return {
    pipelineDataVersion: assertId(raw.pipelineDataVersion, failInput),
    contractVersion: assertId(raw.contractVersion, failInput),
  };
}

function parseUpstreamApplicability(raw: unknown): Rule9UpstreamApplicability {
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  assertExactKeys(raw, ['status', 'reasonCodes'], failInput);
  if (
    typeof raw.status !== 'string' ||
    !(RULE9_APPLICABILITY_STATES as readonly string[]).includes(raw.status)
  ) {
    failInput();
  }
  return {
    status: raw.status as (typeof RULE9_APPLICABILITY_STATES)[number],
    reasonCodes: Object.freeze(assertStringArray(raw.reasonCodes, failInput)),
  };
}

export function validateRule9Input(raw: unknown): Rule9Input {
  if (raw === null || typeof raw !== 'object') failInput();
  if (types.isProxy(raw)) failInput();
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  assertPlainData(raw, new WeakSet(), failInput);
  assertExactKeys(raw, RULE9_INPUT_KEY_ORDER, failInput);

  if (raw.contractVersion !== RULE9_INPUT_CONTRACT_VERSION) failVersion();

  const cloned = canonicalCloneJson(raw) as Record<string, unknown>;

  const input: Rule9Input = {
    contractVersion: RULE9_INPUT_CONTRACT_VERSION,
    requestId: assertId(cloned.requestId, failInput),
    complexityTierRef: parseComplexityTierRef(cloned.complexityTierRef),
    rule1Envelope: parseRuleEnvelope(cloned.rule1Envelope, 1),
    rule2Envelope: parseRuleEnvelope(cloned.rule2Envelope, 2),
    rule3Envelope: parseRuleEnvelope(cloned.rule3Envelope, 3),
    rule4Envelope: parseRuleEnvelope(cloned.rule4Envelope, 4),
    rule5Envelope: parseRuleEnvelope(cloned.rule5Envelope, 5),
    rule6Envelope: parseRuleEnvelope(cloned.rule6Envelope, 6),
    rule7Envelope: parseRuleEnvelope(cloned.rule7Envelope, 7),
    rule8Envelope: parseRuleEnvelope(cloned.rule8Envelope, 8),
    proposedOralComposition: parseProposedOralComposition(cloned.proposedOralComposition),
    evidenceDataVersions: parseEvidenceDataVersions(cloned.evidenceDataVersions),
    upstreamApplicability: parseUpstreamApplicability(cloned.upstreamApplicability),
  };

  return Object.freeze(input);
}

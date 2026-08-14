import { types } from 'node:util';
import {
  RULE2_BLOCKING_LIFECYCLE,
  RULE2_DISEASE_POLARITY_TOKENS,
  RULE2_DOCTOR_ITEM_KEY_ORDER,
  RULE2_EVIDENCE_ENTRY_KEY_ORDER,
  RULE2_INPUT_KEY_ORDER,
  RULE2_SLOT_REF_KEY_ORDER,
  RULE2_SUPPORT_SIGNAL_CLASSES,
  RULE2_SUPPORT_SIGNAL_KEY_ORDER,
  RULE2_SYNTHETIC_TEST_CLASSIFICATION,
  type Rule2DiseasePolarityToken,
  type Rule2SupportSignalClass,
} from './constants.js';
import { Rule2EvaluationError } from './errors.js';
import { canonicalCloneJson } from './freeze.js';
import type {
  Rule2CasePolaritySummary,
  Rule2DoctorSuppliedSlotBoundEvidenceItem,
  Rule2EvidenceDataVersions,
  Rule2FormulaSlotPolarityEvidenceRegistry,
  Rule2FormulaSlotRef,
  Rule2Input,
  Rule2PolarityEvidenceEntry,
  Rule2SlotBoundSupportingSignalRefs,
  Rule2SupportSignalRef,
  Rule2UpstreamApplicability,
} from './types.js';
import { RULE2_INPUT_CONTRACT_VERSION } from './version.js';

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PHI_KEY_RE = /^(patientName|patient_name|fullName|phone|email|address|ssn|mrn)$/i;
const PATH_LIKE_RE = /[\\/]|^[A-Za-z]:|^\\\\/;
const FORBIDDEN_CLINICAL_KEYS = new Set([
  'polarity',
  'medicinePolarity',
  'medicineRegistryPolarity',
  'medicineId',
  'medicineIds',
  'formulaId',
  'formulaMutation',
  'addSlot',
  'removeSlot',
  'reorderSlots',
  'substituteSlot',
  'mutatesMixtures',
  'potency',
  'dosage',
  'electricity',
  'tabletA',
  'tabletB',
  'oralMixture',
  'candidateMedicinePool',
  'relationshipEvidenceRegistry',
  'routeEvidenceRegistry',
  'treatmentInstructions',
  'mixtureCount',
  'externalApplication',
  'monitoringPlan',
  'prescriptionEffect',
  'finalRx',
  'imageBytes',
  'rawImage',
  'filePath',
  'localPath',
  'protectedPath',
  'rule4Pathway',
  'rule4PolarityAdapter',
  'legacyPolarityMap',
  'aiPolaritySuggestion',
]);

type FailFn = () => never;

function failInput(): never {
  throw new Rule2EvaluationError('INVALID_INPUT');
}

function failVersion(): never {
  throw new Rule2EvaluationError('UNSUPPORTED_CONTRACT_VERSION');
}

function failRegistry(): never {
  throw new Rule2EvaluationError('INVALID_EVIDENCE_REGISTRY');
}

function failContradictory(): never {
  throw new Rule2EvaluationError('CONTRADICTORY_INPUT_STATE');
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
    if (PHI_KEY_RE.test(key) || FORBIDDEN_CLINICAL_KEYS.has(key)) fail();
    assertPlainData(value[key], seen, fail);
  }
}

function assertCanonicalId(value: unknown, fail: FailFn = failInput): string {
  if (typeof value !== 'string' || !ID_RE.test(value)) fail();
  if (PATH_LIKE_RE.test(value)) fail();
  return value;
}

function readExactKeys(
  obj: Record<string, unknown>,
  ordered: readonly string[],
  fail: FailFn,
): void {
  const keys = Object.keys(obj);
  if (keys.length !== ordered.length) fail();
  const set = new Set(keys);
  for (const k of ordered) {
    if (!set.has(k)) fail();
  }
  for (const k of keys) {
    if (!ordered.includes(k)) fail();
  }
}

function parseStringListField(value: unknown, fail: FailFn): string[] {
  if (types.isProxy(value)) fail();
  if (!Array.isArray(value)) fail();
  assertDenseArray(value, fail);
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0 || item.length > 256) fail();
    out.push(item);
  }
  return out;
}

function parseDiseasePolarity(value: unknown, fail: FailFn): Rule2DiseasePolarityToken {
  if (typeof value !== 'string') fail();
  if (!(RULE2_DISEASE_POLARITY_TOKENS as readonly string[]).includes(value)) fail();
  return value as Rule2DiseasePolarityToken;
}

function parseEvidenceVersions(value: unknown): Rule2EvidenceDataVersions {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const required = [
    'evidenceDataVersion',
    'polarityRegistryVersion',
    'contractVersion',
    'governanceVersion',
  ] as const;
  readExactKeys(value, required, failInput);
  return {
    evidenceDataVersion: assertCanonicalId(value.evidenceDataVersion),
    polarityRegistryVersion: assertCanonicalId(value.polarityRegistryVersion),
    contractVersion: assertCanonicalId(value.contractVersion),
    governanceVersion: assertCanonicalId(value.governanceVersion),
  };
}

function parseUpstream(value: unknown): Rule2UpstreamApplicability {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  if (!('status' in value) || !('notes' in value) || Object.keys(value).length !== 2) failInput();
  return {
    status: assertCanonicalId(value.status),
    notes: Object.freeze(parseStringListField(value.notes, failInput)),
  };
}

function parseCaseSummary(value: unknown): Rule2CasePolaritySummary {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const keys = Object.keys(value);
  if (keys.length === 1 && value.status === 'NOT_SUPPLIED') {
    return { status: 'NOT_SUPPLIED' };
  }
  if (keys.length !== 4 || value.status !== 'SUPPLIED') failInput();
  if (value.displayOnly !== true) failInput();
  if (value.mustNotDriveSelection !== true) failInput();
  if (value.headline !== null && typeof value.headline !== 'string') failInput();
  if (typeof value.headline === 'string' && value.headline.length > 256) failInput();
  return {
    status: 'SUPPLIED',
    displayOnly: true,
    mustNotDriveSelection: true,
    headline: value.headline as string | null,
  };
}

function parseSupportSignals(value: unknown): Rule2SlotBoundSupportingSignalRefs {
  if (types.isProxy(value)) failInput();
  if (!isPlainObject(value)) failInput();
  assertNoAccessors(value, failInput);
  const keys = Object.keys(value);
  if (keys.length === 1 && value.status === 'NOT_SUPPLIED') {
    return { status: 'NOT_SUPPLIED' };
  }
  if (keys.length !== 2 || value.status !== 'SUPPLIED') failInput();
  if (types.isProxy(value.signals) || !Array.isArray(value.signals)) failInput();
  assertDenseArray(value.signals as unknown[], failInput);
  const signals: Rule2SupportSignalRef[] = [];
  const ids = new Set<string>();
  for (const raw of value.signals) {
    if (types.isProxy(raw)) failInput();
    if (!isPlainObject(raw)) failInput();
    assertNoAccessors(raw, failInput);
    readExactKeys(raw, RULE2_SUPPORT_SIGNAL_KEY_ORDER, failInput);
    const signalRefId = assertCanonicalId(raw.signalRefId);
    if (ids.has(signalRefId)) failInput();
    ids.add(signalRefId);
    if (typeof raw.signalClass !== 'string') failInput();
    if (!(RULE2_SUPPORT_SIGNAL_CLASSES as readonly string[]).includes(raw.signalClass)) {
      failInput();
    }
    signals.push({
      formulaSlotId: assertCanonicalId(raw.formulaSlotId),
      signalClass: raw.signalClass as Rule2SupportSignalClass,
      signalRefId,
    });
  }
  return { status: 'SUPPLIED', signals: Object.freeze(signals) };
}

function parseSlotRefs(value: unknown): readonly Rule2FormulaSlotRef[] {
  if (types.isProxy(value)) failInput();
  if (!Array.isArray(value)) failInput();
  assertDenseArray(value, failInput);
  const ids = new Set<string>();
  const refs: Rule2FormulaSlotRef[] = [];
  for (const raw of value) {
    if (types.isProxy(raw)) failInput();
    if (!isPlainObject(raw)) failInput();
    assertNoAccessors(raw, failInput);
    readExactKeys(raw, RULE2_SLOT_REF_KEY_ORDER, failInput);
    const formulaSlotId = assertCanonicalId(raw.formulaSlotId);
    if (ids.has(formulaSlotId)) failInput();
    ids.add(formulaSlotId);
    refs.push({
      formulaSlotId,
      formulaTargetId: assertCanonicalId(raw.formulaTargetId),
    });
  }
  return Object.freeze(refs);
}

function parseDoctorItems(value: unknown): readonly Rule2DoctorSuppliedSlotBoundEvidenceItem[] {
  if (types.isProxy(value)) failInput();
  if (!Array.isArray(value)) failInput();
  assertDenseArray(value, failInput);
  const ids = new Set<string>();
  const items: Rule2DoctorSuppliedSlotBoundEvidenceItem[] = [];
  for (const raw of value) {
    if (types.isProxy(raw)) failInput();
    if (!isPlainObject(raw)) failInput();
    assertNoAccessors(raw, failInput);
    readExactKeys(raw, RULE2_DOCTOR_ITEM_KEY_ORDER, failInput);
    const itemId = assertCanonicalId(raw.itemId);
    if (ids.has(itemId)) failInput();
    ids.add(itemId);
    items.push({
      itemId,
      formulaSlotId: assertCanonicalId(raw.formulaSlotId),
      evidenceClass: assertCanonicalId(raw.evidenceClass),
    });
  }
  return Object.freeze(items);
}

function parseEvidenceEntry(value: unknown, entryIds: Set<string>): Rule2PolarityEvidenceEntry {
  if (types.isProxy(value)) failRegistry();
  if (!isPlainObject(value)) failRegistry();
  assertNoAccessors(value, failRegistry);
  readExactKeys(value, RULE2_EVIDENCE_ENTRY_KEY_ORDER, failRegistry);

  const entryId = assertCanonicalId(value.entryId, failRegistry);
  if (entryIds.has(entryId)) failRegistry();
  entryIds.add(entryId);

  const supersession = value.supersessionMetadata;
  if (supersession !== null && typeof supersession !== 'string') failRegistry();
  if (typeof supersession === 'string' && supersession.length > 512) failRegistry();

  return {
    entryId,
    formulaSlotId: assertCanonicalId(value.formulaSlotId, failRegistry),
    formulaTargetId: assertCanonicalId(value.formulaTargetId, failRegistry),
    diseasePolarity: parseDiseasePolarity(value.diseasePolarity, failRegistry),
    contradictionMarkers: Object.freeze(
      parseStringListField(value.contradictionMarkers, failRegistry),
    ),
    evidenceSourceId: assertCanonicalId(value.evidenceSourceId, failRegistry),
    evidenceValidationStatus: assertCanonicalId(value.evidenceValidationStatus, failRegistry),
    ownerClinicalApprovalStatus: assertCanonicalId(value.ownerClinicalApprovalStatus, failRegistry),
    version: assertCanonicalId(value.version, failRegistry),
    effectiveStatus: assertCanonicalId(value.effectiveStatus, failRegistry),
    supersessionMetadata: supersession as string | null,
    testClassification: assertCanonicalId(value.testClassification, failRegistry),
  };
}

function parseRegistry(value: unknown): Rule2FormulaSlotPolarityEvidenceRegistry {
  if (types.isProxy(value)) failRegistry();
  if (!isPlainObject(value)) failRegistry();
  assertNoAccessors(value, failRegistry);
  if (!('registryVersion' in value) || !('entries' in value) || Object.keys(value).length !== 2) {
    failRegistry();
  }
  const registryVersion = assertCanonicalId(value.registryVersion, failRegistry);
  if (types.isProxy(value.entries) || !Array.isArray(value.entries)) failRegistry();
  assertDenseArray(value.entries as unknown[], failRegistry);
  const entryIds = new Set<string>();
  const entries: Rule2PolarityEvidenceEntry[] = [];
  for (const raw of value.entries) {
    entries.push(parseEvidenceEntry(raw, entryIds));
  }
  return {
    registryVersion,
    entries: Object.freeze(entries),
  };
}

/**
 * Conjunctive activating gate for synthetic shadow polarity annotation only.
 * Real production mappings remain empty; non-synthetic classification never activates.
 */
export function isActivatingPolarityEvidence(entry: Rule2PolarityEvidenceEntry): boolean {
  if (entry.testClassification !== RULE2_SYNTHETIC_TEST_CLASSIFICATION) {
    return false;
  }
  if ((RULE2_BLOCKING_LIFECYCLE as readonly string[]).includes(entry.effectiveStatus)) {
    return false;
  }
  return (
    entry.evidenceValidationStatus === 'validated' &&
    entry.ownerClinicalApprovalStatus === 'approved' &&
    entry.effectiveStatus === 'APPROVED_AND_ACTIVE'
  );
}

export function validateRule2Input(raw: unknown): Rule2Input {
  if (types.isProxy(raw)) failInput();
  if (!isPlainObject(raw)) failInput();
  assertNoAccessors(raw, failInput);
  assertPlainData(raw, new WeakSet(), failInput);
  readExactKeys(raw, RULE2_INPUT_KEY_ORDER, failInput);

  if (raw.contractVersion !== RULE2_INPUT_CONTRACT_VERSION) failVersion();

  const cloned = canonicalCloneJson(raw) as Record<string, unknown>;
  if (!isPlainObject(cloned)) failInput();

  let registry: Rule2FormulaSlotPolarityEvidenceRegistry;
  try {
    registry = parseRegistry(cloned.formulaSlotPolarityEvidenceRegistry);
  } catch (e) {
    if (e instanceof Rule2EvaluationError) throw e;
    failRegistry();
  }

  const upstream = parseUpstream(cloned.upstreamApplicability);
  if (
    upstream.status !== 'APPLICABLE' &&
    upstream.status !== 'NOT_APPLICABLE' &&
    upstream.status !== 'NOT_EVALUABLE'
  ) {
    failContradictory();
  }

  const orderedFormulaSlotRefs = parseSlotRefs(cloned.orderedFormulaSlotRefs);
  if (upstream.status === 'APPLICABLE' && orderedFormulaSlotRefs.length === 0) {
    failInput();
  }

  return {
    contractVersion: RULE2_INPUT_CONTRACT_VERSION,
    requestId: assertCanonicalId(cloned.requestId),
    formulaSlotPolarityEvidenceRegistry: registry,
    orderedFormulaSlotRefs,
    doctorSuppliedSlotBoundEvidenceItems: parseDoctorItems(
      cloned.doctorSuppliedSlotBoundEvidenceItems,
    ),
    casePolaritySummary: parseCaseSummary(cloned.casePolaritySummary),
    slotBoundSupportingSignalRefs: parseSupportSignals(cloned.slotBoundSupportingSignalRefs),
    evidenceDataVersions: parseEvidenceVersions(cloned.evidenceDataVersions),
    upstreamApplicability: upstream,
  };
}

/** P2-C2 synthetic repo-safe manifest schema — in-memory only; no fs/crypto/network. */

export const RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_PROTOTYPE =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_PROTOTYPE';
export const RULE5_SYNTHETIC_MANIFEST_SYMBOL_KEY = 'RULE5_SYNTHETIC_MANIFEST_SYMBOL_KEY';
export const RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY = 'RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY';
export const RULE5_SYNTHETIC_MANIFEST_UNEXPECTED_FIELD =
  'RULE5_SYNTHETIC_MANIFEST_UNEXPECTED_FIELD';
export const RULE5_SYNTHETIC_MANIFEST_MISSING_FIELD = 'RULE5_SYNTHETIC_MANIFEST_MISSING_FIELD';
export const RULE5_SYNTHETIC_MANIFEST_ACCESSOR_PROPERTY =
  'RULE5_SYNTHETIC_MANIFEST_ACCESSOR_PROPERTY';
export const RULE5_SYNTHETIC_MANIFEST_NESTED_VALUE_FORBIDDEN =
  'RULE5_SYNTHETIC_MANIFEST_NESTED_VALUE_FORBIDDEN';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_FIELD_TYPE =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_FIELD_TYPE';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_MANIFEST_VERSION =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_MANIFEST_VERSION';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_SCHEMA_KIND =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_SCHEMA_KIND';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_TRUST_ZONE =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_TRUST_ZONE';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_PERSISTENCE_CLASS =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_PERSISTENCE_CLASS';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_TOOL_VERSION =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_TOOL_VERSION';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_POLICY_VERSION =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_POLICY_VERSION';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_ARTIFACT_ID =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_ARTIFACT_ID';
export const RULE5_SYNTHETIC_MANIFEST_PROTECTED_SOURCE_NOT_FALSE =
  'RULE5_SYNTHETIC_MANIFEST_PROTECTED_SOURCE_NOT_FALSE';
export const RULE5_SYNTHETIC_MANIFEST_OWNER_PRIMARY_NOT_FALSE =
  'RULE5_SYNTHETIC_MANIFEST_OWNER_PRIMARY_NOT_FALSE';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_PHI_STATUS =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_PHI_STATUS';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_MANUAL_REVIEW_STATUS =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_MANUAL_REVIEW_STATUS';
export const RULE5_SYNTHETIC_MANIFEST_INVALID_STRUCTURAL_STATUS =
  'RULE5_SYNTHETIC_MANIFEST_INVALID_STRUCTURAL_STATUS';
export const RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE = 'RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE';

export const MANIFEST_VERSION = 'RULE5_SYNTHETIC_REPO_SAFE_MANIFEST_V1';
export const SCHEMA_KIND = 'RULE5_SYNTHETIC_REPO_SAFE_MANIFEST';
export const TRUST_ZONE = 'CI_SYNTHETIC_ONLY';
export const PERSISTENCE_CLASS = 'REPOSITORY_SAFE_SYNTHETIC_ONLY';
export const TOOL_VERSION = 'P2-C2-1';
export const POLICY_VERSION = 'P2-C1-1';
export const PHI_STATUS = 'NOT_APPLICABLE_SYNTHETIC';
export const MANUAL_REVIEW_STATUS = 'NOT_APPLICABLE_SYNTHETIC';
export const STRUCTURAL_STATUS = 'SYNTHETIC_ONLY_NOT_EVIDENCE';

const ARTIFACT_ID_RE = /^SYN-[0-9]{4,12}$/;
const SHA_LIKE_RE = /^sha256:[0-9a-f]{64}$/i;
const RULE4_KEY_RE = /^(TH|DA)-\d{2}$/;

const ALLOWLIST = new Set([
  'manifestVersion',
  'schemaKind',
  'trustZone',
  'persistenceClass',
  'sourceArtifactId',
  'toolVersion',
  'policyVersion',
  'protectedSourceAccessed',
  'ownerPrimaryVerified',
  'phiStatus',
  'manualReviewStatus',
  'structuralStatus',
]);

const CANONICAL_FIELD_ORDER = [
  'manifestVersion',
  'schemaKind',
  'trustZone',
  'persistenceClass',
  'sourceArtifactId',
  'toolVersion',
  'policyVersion',
  'protectedSourceAccessed',
  'ownerPrimaryVerified',
  'phiStatus',
  'manualReviewStatus',
  'structuralStatus',
];

const EXACT_FORBIDDEN_UNEXPECTED_KEY = new Set([
  'activation',
  'activationapproved',
  'active',
  'affectsclinical',
  'algorithm',
  'anchor',
  'apikey',
  'approved',
  'argv',
  'artifactpath',
  'attribution',
  'body',
  'bom',
  'byteproof',
  'bytelength',
  'cache',
  'caseid',
  'catalog',
  'catalogrowid',
  'catalogid',
  'checksum',
  'clinicallyvalidated',
  'clinical',
  'comment',
  'complete',
  'config',
  'connected',
  'consultationid',
  'content',
  'correlationid',
  'credential',
  'crypto',
  'cwd',
  'data',
  'deid',
  'deidentified',
  'delete',
  'description',
  'desktop',
  'details',
  'device',
  'diagnosis',
  'digest',
  'digestpresent',
  'directory',
  'doctor',
  'dosageroute',
  'dosage',
  'drive',
  'eol',
  'entries',
  'env',
  'error',
  'evidence',
  'evidenceid',
  'executable',
  'file',
  'filename',
  'filepath',
  'filepathname',
  'fingerprint',
  'fingerprintversion',
  'folder',
  'freeform',
  'glob',
  'hash',
  'header',
  'hmac',
  'home',
  'host',
  'hostname',
  'info',
  'infile',
  'interval',
  'iv',
  'jsonl',
  'lab',
  'length',
  'license',
  'lifecycle',
  'lifecyclestate',
  'log',
  'machine',
  'manifestpath',
  'md5',
  'medicine',
  'medicinecode',
  'medicineid',
  'mednone',
  'message',
  'metadata',
  'mismatch',
  'monitoring',
  'name',
  'nonce',
  'note',
  'normalized',
  'open',
  'operator',
  'outfile',
  'pass',
  'password',
  'patient',
  'patientid',
  'patientname',
  'payload',
  'persistence',
  'persist',
  'personid',
  'phi',
  'phone',
  'potency',
  'potencylevel',
  'primaryverified',
  'private',
  'proven',
  'provenance',
  'provenanceverified',
  'protected',
  'quarantine',
  'quarantined',
  'random',
  'raw',
  'rawcontent',
  'read',
  'ready',
  'realdigest',
  'realpath',
  'reason',
  'registry',
  'requestid',
  'route',
  'rowid',
  'salt',
  'schemavalidated',
  'secret',
  'seed',
  'sha',
  'sha1',
  'sha256',
  'signature',
  'size',
  'snippet',
  'sourcebytes',
  'sourcefile',
  'sourcepath',
  'sourcepresent',
  'sourcetext',
  'stack',
  'subjectid',
  'symptom',
  'temp',
  'tenantid',
  'text',
  'threshold',
  'timestamp',
  'timing',
  'title',
  'tmp',
  'token',
  'transcript',
  'user',
  'username',
  'uuid',
  'validated',
  'verified',
  'vital',
  'wrapper',
  'write',
  'xml',
]);

const FORBIDDEN_SUBSTRINGS = [
  'patient',
  'person',
  'subject',
  'operator',
  'doctor',
  'clinician',
  'hostname',
  'filepath',
  'filename',
  'pathname',
  'sourcepath',
  'directory',
  'folder',
  'transcript',
  'snippet',
  'digest',
  'checksum',
  'fingerprint',
  'sha256',
  'sha1',
  'bytelength',
  'byte_length',
  'filesize',
  'encoding',
  'jsonl',
  'wrapper',
  'header',
  'medicine',
  'potency',
  'dosage',
  'route',
  'electricity',
  'catalogrow',
  'rowid',
  'evidenceid',
  'caseid',
  'tenantid',
  'correlation',
  'timestamp',
  'datetime',
  'password',
  'secret',
  'credential',
  'apikey',
  'patientid',
  'sourcetext',
  'rawtext',
  'freeform',
  'deident',
  'deid',
  'provenance',
  'diagnosis',
  'symptom',
  'monitoring',
  'threshold',
  'activation',
  'approved',
  'verified',
  'proven',
  'validated',
  'persist',
  'outfile',
  'infile',
  'tempfile',
  'crypto',
  'algorithm',
  'lifecycle',
  'implemented',
  'connected',
  'executable',
  'payload',
  'metadata',
  'sourcefile',
  'sourcebytes',
  'byteproof',
  'realdigest',
  'ownerprimary',
  'primaryverified',
  'catalog',
  'evidence',
];

const AFFIRMATIVE_SUBSTRINGS = [
  'VERIFIED',
  'PROVEN',
  'APPROVED',
  'PASS',
  'COMPLETE',
  'READY',
  'ACTIVE',
  'VALIDATED',
];

export class Rule5SyntheticManifestValidationError extends Error {
  /** @param {string} failureCode */
  constructor(failureCode) {
    super(failureCode);
    this.name = 'Rule5SyntheticManifestValidationError';
    this.failureCode = failureCode;
  }
}

/** @param {string} failureCode @returns {never} */
function fail(failureCode) {
  throw new Rule5SyntheticManifestValidationError(failureCode);
}

/** @param {string} key */
function asciiLowerKey(key) {
  return key.replace(/[A-Z]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 32));
}

/**
 * @param {string} key
 * @returns {string}
 */
function classifyUnexpectedKeyFailure(key) {
  if (RULE4_KEY_RE.test(key)) {
    return RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY;
  }
  const lower = asciiLowerKey(key);
  if (EXACT_FORBIDDEN_UNEXPECTED_KEY.has(lower)) {
    return RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY;
  }
  for (const sub of FORBIDDEN_SUBSTRINGS) {
    if (lower.includes(sub)) {
      return RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_KEY;
    }
  }
  return RULE5_SYNTHETIC_MANIFEST_UNEXPECTED_FIELD;
}

/** @param {string[]} keys */
function sortUnexpectedStringKeys(keys) {
  return keys.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** @param {unknown} value */
function isNestedForbiddenValue(value) {
  return value === null || value === undefined || (typeof value === 'object' && value !== null);
}

/** @param {string} value */
function isShaLike(value) {
  return SHA_LIKE_RE.test(value);
}

/** @param {string} value */
function hasAffirmativeSubstring(value) {
  const upper = value.toUpperCase();
  for (const sub of AFFIRMATIVE_SUBSTRINGS) {
    if (upper.includes(sub)) {
      return true;
    }
  }
  return false;
}

/** @param {unknown} obj */
function sortKeysDeep(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  /** @type {Record<string, unknown>} */
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortKeysDeep(obj[key]);
  }
  return sorted;
}

/** @param {Record<string, unknown>} obj */
function canonicalStableDumps(obj) {
  return JSON.stringify(sortKeysDeep(obj));
}

/**
 * @param {unknown} input
 * @returns {Readonly<Record<string, unknown>>}
 */
export function validateSyntheticManifest(input) {
  if (typeof input !== 'object' || input === null) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT);
  }
  let isArray;
  try {
    isArray = Array.isArray(input);
  } catch (err) {
    if (err instanceof Rule5SyntheticManifestValidationError) {
      throw err;
    }
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT);
  }
  if (isArray) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT);
  }

  /** @type {object} */
  const obj = /** @type {object} */ (input);

  /** @type {object | null} */
  let proto;
  try {
    proto = Object.getPrototypeOf(obj);
  } catch (err) {
    if (err instanceof Rule5SyntheticManifestValidationError) {
      throw err;
    }
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT);
  }
  if (proto !== Object.prototype) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_PROTOTYPE);
  }

  /** @type {PropertyKey[]} */
  let ownKeys;
  try {
    ownKeys = Reflect.ownKeys(obj);
  } catch (err) {
    if (err instanceof Rule5SyntheticManifestValidationError) {
      throw err;
    }
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT);
  }

  for (const key of ownKeys) {
    if (typeof key === 'symbol') {
      fail(RULE5_SYNTHETIC_MANIFEST_SYMBOL_KEY);
    }
  }

  const ownStringKeys = ownKeys.filter((k) => typeof k === 'string');
  const ownStringKeySet = new Set(ownStringKeys);
  const unexpected = ownStringKeys.filter((k) => !ALLOWLIST.has(k));
  if (unexpected.length > 0) {
    const first = sortUnexpectedStringKeys(unexpected)[0];
    fail(classifyUnexpectedKeyFailure(first));
  }

  for (const field of CANONICAL_FIELD_ORDER) {
    if (!ownStringKeySet.has(field)) {
      fail(RULE5_SYNTHETIC_MANIFEST_MISSING_FIELD);
    }
  }

  /** @type {Record<string, PropertyDescriptor | undefined>} */
  const descriptors = {};
  for (const field of CANONICAL_FIELD_ORDER) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(obj, field);
    } catch (err) {
      if (err instanceof Rule5SyntheticManifestValidationError) {
        throw err;
      }
      fail(RULE5_SYNTHETIC_MANIFEST_INVALID_DOCUMENT);
    }
    if (
      descriptor === undefined ||
      'get' in descriptor ||
      'set' in descriptor ||
      !('value' in descriptor)
    ) {
      fail(RULE5_SYNTHETIC_MANIFEST_ACCESSOR_PROPERTY);
    }
    descriptors[field] = descriptor;
  }

  for (const field of CANONICAL_FIELD_ORDER) {
    const value = descriptors[field].value;
    if (isNestedForbiddenValue(value)) {
      fail(RULE5_SYNTHETIC_MANIFEST_NESTED_VALUE_FORBIDDEN);
    }
  }

  const stringFields = new Set([
    'manifestVersion',
    'schemaKind',
    'trustZone',
    'persistenceClass',
    'sourceArtifactId',
    'toolVersion',
    'policyVersion',
    'phiStatus',
    'manualReviewStatus',
    'structuralStatus',
  ]);
  const booleanFields = new Set(['protectedSourceAccessed', 'ownerPrimaryVerified']);

  for (const field of CANONICAL_FIELD_ORDER) {
    const value = descriptors[field].value;
    if (stringFields.has(field)) {
      if (typeof value !== 'string') {
        fail(RULE5_SYNTHETIC_MANIFEST_INVALID_FIELD_TYPE);
      }
    } else if (booleanFields.has(field)) {
      if (typeof value !== 'boolean') {
        fail(RULE5_SYNTHETIC_MANIFEST_INVALID_FIELD_TYPE);
      }
    }
  }

  for (const field of CANONICAL_FIELD_ORDER) {
    const value = descriptors[field].value;
    if (typeof value === 'string' && isShaLike(value)) {
      fail(RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE);
    }
  }

  if (descriptors.manifestVersion.value !== MANIFEST_VERSION) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_MANIFEST_VERSION);
  }
  if (descriptors.schemaKind.value !== SCHEMA_KIND) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_SCHEMA_KIND);
  }
  if (descriptors.trustZone.value !== TRUST_ZONE) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_TRUST_ZONE);
  }
  if (descriptors.persistenceClass.value !== PERSISTENCE_CLASS) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_PERSISTENCE_CLASS);
  }
  if (descriptors.toolVersion.value !== TOOL_VERSION) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_TOOL_VERSION);
  }
  if (descriptors.policyVersion.value !== POLICY_VERSION) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_POLICY_VERSION);
  }

  const artifactId = descriptors.sourceArtifactId.value;
  if (typeof artifactId !== 'string' || !ARTIFACT_ID_RE.test(artifactId)) {
    fail(RULE5_SYNTHETIC_MANIFEST_INVALID_ARTIFACT_ID);
  }

  if (descriptors.protectedSourceAccessed.value !== false) {
    fail(RULE5_SYNTHETIC_MANIFEST_PROTECTED_SOURCE_NOT_FALSE);
  }
  if (descriptors.ownerPrimaryVerified.value !== false) {
    fail(RULE5_SYNTHETIC_MANIFEST_OWNER_PRIMARY_NOT_FALSE);
  }

  const statusChecks = [
    ['phiStatus', PHI_STATUS, RULE5_SYNTHETIC_MANIFEST_INVALID_PHI_STATUS],
    [
      'manualReviewStatus',
      MANUAL_REVIEW_STATUS,
      RULE5_SYNTHETIC_MANIFEST_INVALID_MANUAL_REVIEW_STATUS,
    ],
    ['structuralStatus', STRUCTURAL_STATUS, RULE5_SYNTHETIC_MANIFEST_INVALID_STRUCTURAL_STATUS],
  ];

  for (const [field, expected, invalidCode] of statusChecks) {
    const value = descriptors[field].value;
    if (typeof value !== 'string') {
      fail(RULE5_SYNTHETIC_MANIFEST_INVALID_FIELD_TYPE);
    }
    if (value === expected) {
      continue;
    }
    if (hasAffirmativeSubstring(value)) {
      fail(RULE5_SYNTHETIC_MANIFEST_FORBIDDEN_VALUE);
    }
    fail(invalidCode);
  }

  const copy = Object.freeze({
    manifestVersion: MANIFEST_VERSION,
    schemaKind: SCHEMA_KIND,
    trustZone: TRUST_ZONE,
    persistenceClass: PERSISTENCE_CLASS,
    sourceArtifactId: artifactId,
    toolVersion: TOOL_VERSION,
    policyVersion: POLICY_VERSION,
    protectedSourceAccessed: false,
    ownerPrimaryVerified: false,
    phiStatus: PHI_STATUS,
    manualReviewStatus: MANUAL_REVIEW_STATUS,
    structuralStatus: STRUCTURAL_STATUS,
  });

  return copy;
}

/**
 * @param {unknown} input
 * @returns {string}
 */
export function serializeSyntheticManifest(input) {
  const copy = validateSyntheticManifest(input);
  return `${canonicalStableDumps(copy)}\n`;
}

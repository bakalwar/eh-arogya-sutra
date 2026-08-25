import { createHash } from 'node:crypto';
import { ALLOWED_DISEASE_IDENTITY_SQL } from './sqlitePrivacy.js';
import { LEGACY_AUTHORITY } from './constants.js';
import {
  PRIVATE_ENGINEERING_LICENSING_CLASSIFICATION,
  FULL_CORPUS_GENERATOR_VERSION,
} from './fullCorpusConstants.js';

/** Owner token required to execute one sanitized derivation (future gate). */
export const SANITIZED_DERIVE_AUTHORIZATION_TOKEN =
  'R2-DATA-P2C-C-DERIVE-01: AUTHORIZE_ONE_SANITIZED_LEGACY_DISEASE_IDENTITY_DERIVATION' as const;

export const DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB = 'FULL_LEGACY_DB_FILE_V1' as const;
export const DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL =
  'SANITIZED_LEGACY_DISEASE_IDENTITY_JSONL_V1' as const;

export type DbIdentityInputClass =
  typeof DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB | typeof DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL;

export const SANITIZED_ARTIFACT_KIND = 'SANITIZED_LEGACY_DISEASE_IDENTITY_JSONL_V1' as const;
export const SANITIZED_RECORD_SCHEMA_VERSION =
  'ehas2-sanitized-legacy-disease-identity-record-v1' as const;
export const SANITIZED_DATASET_VERSION = 'ehas2-sanitized-legacy-disease-identity-v1' as const;
export const SANITIZED_MANIFEST_SCHEMA_VERSION =
  'ehas2-sanitized-legacy-disease-identity-manifest-v1' as const;
export const SANITIZED_SOURCE_CLASS = 'LIVE_SQLITE_READONLY_TRANSACTION_V1' as const;
export const SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION = 'DERIVED_PENDING_ADOPTION' as const;
export const SANITIZED_PRIVACY_CLASSIFICATION = 'SANITIZED_IDENTITY_NO_PHI' as const;
export const SANITIZED_CLINICAL_AUTHORITY = 'NONE' as const;

export const ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM =
  'EHAS2_ORDERED_SANITIZED_DISEASE_IDENTITY_FP_V1_SHA256' as const;
export const ORDERED_SANITIZED_IDENTITY_FP_DOMAIN_PREFIX =
  'EHAS2_ORDERED_SANITIZED_DISEASE_IDENTITY_FP_V1' as const;

export const DISEASE_IDENTITY_SQL_QUERY_ID = 'EHAS2_DISEASE_IDENTITY_SQL_V1' as const;

/** Exact UTF-8 SHA-256 of ALLOWED_DISEASE_IDENTITY_SQL (no whitespace variance). */
export const DISEASE_IDENTITY_SQL_SHA256 = createHash('sha256')
  .update(ALLOWED_DISEASE_IDENTITY_SQL, 'utf8')
  .digest('hex');

/** Must equal pinned constant (computed once at module load for fail-closed pin checks). */
export const PINNED_DISEASE_IDENTITY_SQL_SHA256 =
  'dd936ecf5f21ca877fac1b9c78ef2b571167ce05ef2c8d507b13960b483391d7' as const;

if (DISEASE_IDENTITY_SQL_SHA256 !== PINNED_DISEASE_IDENTITY_SQL_SHA256) {
  throw new Error('DISEASE_IDENTITY_SQL_SHA256 pin drift — refuse to load package');
}

export const SANITIZED_LEGACY_AUTHORITY = LEGACY_AUTHORITY;

export const SANITIZED_LICENSING_CLASSIFICATION = PRIVATE_ENGINEERING_LICENSING_CLASSIFICATION;

export const SANITIZED_ADOPTION_MANIFEST_KIND =
  'EHAS2_SANITIZED_DISEASE_IDENTITY_ADOPTION_MANIFEST_V1' as const;
export const SANITIZED_ADOPTION_MANIFEST_SCHEMA_VERSION =
  'ehas2-sanitized-disease-identity-adoption-manifest-v1' as const;

/** Relative to repository root; adoption IDs resolve only under this directory. */
export const SANITIZED_ADOPTION_CONTROL_PLANE_RELDIR =
  'docs/clinical/disease-identity/sanitized-adoption-manifests' as const;

/** Closed filename: `<id>.adoption.json` */
export const SANITIZED_ADOPTION_FILENAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}\.adoption\.json$/;

export const SANITIZED_MAX_LINE_BYTES = 8192;
export const SANITIZED_MAX_CODE_CHARS = 512;
/** Hard ceiling for a sanitized JSONL artifact (production ~tens of MB; leave headroom). */
export const SANITIZED_MAX_ARTIFACT_BYTES = 64 * 1024 * 1024;
export const SANITIZED_MAX_SYNTHETIC_ROWS = 256;

export const SANITIZED_PACKAGE_MEMBER_NAMES = [
  'sanitized-disease-identity.jsonl',
  'sanitized-disease-identity.manifest.json',
  'sanitized-derivation-evidence.json',
  'ehas2-sanitized-derivation-activation.json',
] as const;

export const SANITIZED_ACTIVATION_MARKER_NAME =
  'ehas2-sanitized-derivation-activation.json' as const;

export const SANITIZED_EXCLUSIONS = [
  'consultations',
  'patients',
  'names',
  'prose',
  'medicines',
  'prescriptions',
  'polarity',
  'fts',
  'vector',
  'absolute_paths',
  'credentials',
  'machine_identity',
] as const;

export const FULL_CORPUS_GENERATOR_VERSION_SANITIZED = FULL_CORPUS_GENERATOR_VERSION;

export const HISTORICAL_P2A_LEGACY_MAIN_FILE_EVIDENCE_LABEL =
  'P2A_HISTORICAL_MAIN_FILE_SHA256_REF' as const;

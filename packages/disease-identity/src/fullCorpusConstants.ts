/** Pinned P2A engineering evidence — identity axis only; not clinical authority. */
export const FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN =
  'R2-DATA-P2C: AUTHORIZE_FULL_CANONICAL_IDENTITY_ARTIFACT_GENERATION_AND_VERIFICATION' as const;

export const PINNED_LEGACY_DB_SHA256 =
  'c3ff59f862ead2559e116cf6a4f629b7259bbd12d73385f299b780f25c4d1154' as const;

export const PINNED_MAPPED_JSON_SHA256 =
  '80b5d26cd06dec087350a64643933c3889f3553790653cb9dbc1f48b3531bda6' as const;

export const PINNED_BRIDGE_V3_SHA256 =
  '590751852f4e4757581e6348ddc67fb5415a608b5a7e42ec6c2f885aba3f8fdc' as const;

export const PINNED_INVENTORY_SHA256 =
  'e639685db08ac8acec965ee2234277305fbce6db7dfc89569a351bf4b84ae2a9' as const;

export const EXPECTED_LEGACY_DB_DISEASE_COUNT = 116_284 as const;
export const EXPECTED_MAPPED_JSON_ROW_COUNT = 102_320 as const;
export const EXPECTED_MAPPED_UNIQUE_CODE_COUNT = 50_544 as const;
export const EXPECTED_BRIDGE_ROW_COUNT = 50_544 as const;
export const EXPECTED_INVENTORY_ROW_COUNT = 102_320 as const;

export const EXPECTED_RELATIONSHIP_EDGE_COUNT = 33_070 as const;
export const EXPECTED_UNRESOLVED_QUEUE_COUNT = 17_474 as const;
/** Unique DB disease IDs referenced by at least one bridge candidate. */
export const EXPECTED_REFERENCED_UNIQUE_DB_IDS = 98_181 as const;

export const FULL_CORPUS_GENERATOR_VERSION = '0.2.1-p2c-full-corpus-tooling-harden' as const;

export const BUNDLE_KIND_PRODUCTION = 'EHAS2_FULL_CANONICAL_DISEASE_IDENTITY_LEDGER_V1' as const;
export const BUNDLE_KIND_SYNTHETIC = 'EHAS2_SYNTHETIC_DISEASE_IDENTITY_FIXTURE_V1' as const;
export const BUNDLE_ACTIVATION_MARKER_NAME = 'ehas2-bundle-activation.json' as const;

/** Recommended free-space floor for a future authorized full-corpus build (bytes). */
export const RECOMMENDED_MINIMUM_FREE_BYTES = 1_500_000_000;

/**
 * Conservative engineering estimate for the disk-indexed production path. The
 * runtime bound comes from parser/record limits and the controlled SQLite index,
 * not from retaining corpus-sized JavaScript collections.
 */
export const ESTIMATED_PEAK_MEMORY_BUDGET_BYTES = 512 * 1024 * 1024;

/** @deprecated Use ESTIMATED_PEAK_MEMORY_BUDGET_BYTES — not a runtime enforcement. */
export const DOCUMENTED_PEAK_MEMORY_BUDGET_BYTES = ESTIMATED_PEAK_MEMORY_BUDGET_BYTES;

/** Fail-closed: a single staged bundle member must not exceed this size. */
export const MAX_STAGING_MEMBER_BYTES = 512 * 1024 * 1024;

/** Fail closed if the private, temporary SQLite build index grows beyond 2 GiB. */
export const MAX_CONTROLLED_INDEX_BYTES = 2 * 1024 * 1024 * 1024;

export const PRIVATE_ENGINEERING_LICENSING_CLASSIFICATION =
  'PRIVATE_ENGINEERING_IDENTITY_PENDING_LEGAL_CLEARANCE' as const;

export const BUNDLE_ARTIFACT_NAMES = [
  'disease-identity-ledger.jsonl',
  'mapped-index.jsonl',
  'relationship-edges.jsonl',
  'unresolved-queue.jsonl',
  'bundle-manifest.json',
  'p2c-build-evidence.json',
  BUNDLE_ACTIVATION_MARKER_NAME,
] as const;

export type BundleArtifactName = (typeof BUNDLE_ARTIFACT_NAMES)[number];

export const RELATIONSHIP_TYPE_EXACT_UNIQUE = 'EXACT_UNIQUE_MATCH' as const;

/** Placeholder filled by CLI via `git rev-parse HEAD` into build evidence only. */
export const SOURCE_COMMIT_UNSET = 'SOURCE_COMMIT_UNSET' as const;

/** Fixed commit marker for synthetic unit tests (not a real git SHA). */
export const SYNTHETIC_TEST_COMMIT = 'SYNTHETIC_TEST_COMMIT' as const;

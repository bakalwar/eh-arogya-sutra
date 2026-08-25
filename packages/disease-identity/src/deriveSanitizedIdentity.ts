import { DiseaseIdentityError } from './errors.js';
import {
  EXPECTED_LEGACY_DB_DISEASE_COUNT,
  PINNED_LEGACY_DB_SHA256,
} from './fullCorpusConstants.js';
import { assertProductionGeneratorReady } from './generatorGate.js';
import {
  SANITIZED_DERIVE_AUTHORIZATION_TOKEN,
  SANITIZED_MAX_SYNTHETIC_ROWS,
} from './sanitizedIdentityConstants.js';
import {
  executeSanitizedDeriveOrchestration,
  type SanitizedDeriveOrchestrationResult,
} from './sanitizedDeriveOrchestration.js';

export type DeriveSanitizedIdentityInput = {
  readonly authorizeDeriveFlag: boolean;
  readonly ownerToken: string;
  readonly repoRoot: string;
  readonly sourceDbPath: string;
  readonly sourceEvidenceRefHistoricalMainSha256: string;
  readonly outputDir: string;
  readonly expectedGeneratorCommit: string;
  readonly minimumFreeBytes?: number;
};

export type DeriveSanitizedIdentityResult = SanitizedDeriveOrchestrationResult;

function assertDeriveAuthorized(input: DeriveSanitizedIdentityInput): void {
  if (!input.authorizeDeriveFlag) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Sanitized derivation requires --authorize-derive-sanitized-identity',
    );
  }
  if (input.ownerToken !== SANITIZED_DERIVE_AUTHORIZATION_TOKEN) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized derivation owner token mismatch');
  }
}

/**
 * Production sanitized derivation — always requires generator gate and exactly 116,284 rows.
 * Does not print row values. Does not checkpoint/copy WAL/SHM.
 */
export async function deriveSanitizedDiseaseIdentity(
  input: DeriveSanitizedIdentityInput,
): Promise<DeriveSanitizedIdentityResult> {
  assertDeriveAuthorized(input);
  if (input.sourceEvidenceRefHistoricalMainSha256 !== PINNED_LEGACY_DB_SHA256) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'source evidence ref must equal historical P2A main-file SHA pin',
    );
  }

  const generator = assertProductionGeneratorReady({
    repoRoot: input.repoRoot,
    expectedGeneratorCommit: input.expectedGeneratorCommit,
  });

  return executeSanitizedDeriveOrchestration({
    repoRoot: input.repoRoot,
    sourceDbPath: input.sourceDbPath,
    outputDir: input.outputDir,
    expectedRecordCount: EXPECTED_LEGACY_DB_DISEASE_COUNT,
    generatorSourceCommit: generator.generatorSourceCommit,
    minimumFreeBytes: input.minimumFreeBytes,
  });
}

export type SyntheticSanitizedDeriveHarnessInput = Omit<
  DeriveSanitizedIdentityInput,
  'expectedGeneratorCommit'
> & {
  readonly expectedGeneratorCommit: string;
  readonly expectedRecordCount: number;
  readonly skipGeneratorGate?: boolean;
  readonly betweenPassesHook?: () => void | Promise<void>;
};

/** Internal synthetic harness — not reachable from production CLI or public exports. */
export async function deriveSanitizedDiseaseIdentitySyntheticHarness(
  input: SyntheticSanitizedDeriveHarnessInput,
): Promise<DeriveSanitizedIdentityResult> {
  assertDeriveAuthorized(input);
  if (input.sourceEvidenceRefHistoricalMainSha256 !== PINNED_LEGACY_DB_SHA256) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'source evidence ref must equal historical P2A main-file SHA pin',
    );
  }
  if (
    !Number.isSafeInteger(input.expectedRecordCount) ||
    input.expectedRecordCount <= 0 ||
    input.expectedRecordCount > SANITIZED_MAX_SYNTHETIC_ROWS
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Synthetic derive row count out of bounds');
  }

  let generatorSourceCommit = input.expectedGeneratorCommit;
  if (!input.skipGeneratorGate) {
    const generator = assertProductionGeneratorReady({
      repoRoot: input.repoRoot,
      expectedGeneratorCommit: input.expectedGeneratorCommit,
    });
    generatorSourceCommit = generator.generatorSourceCommit;
  } else if (!/^[0-9a-f]{40}$/i.test(generatorSourceCommit)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Synthetic harness skipGeneratorGate requires 40-hex commit',
    );
  }

  return executeSanitizedDeriveOrchestration({
    repoRoot: input.repoRoot,
    sourceDbPath: input.sourceDbPath,
    outputDir: input.outputDir,
    expectedRecordCount: input.expectedRecordCount,
    generatorSourceCommit: generatorSourceCommit.toLowerCase(),
    minimumFreeBytes: input.minimumFreeBytes,
    betweenPassesHook: input.betweenPassesHook,
  });
}

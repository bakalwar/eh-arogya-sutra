import { SANITIZED_CLI_REJECTED_FLAGS } from './sanitizedIdentityConstants.js';
import { DiseaseIdentityError } from './errors.js';

/** Fail closed when production CLI receives synthetic/test bypass flags. */
export function assertSanitizedProductionCliFlagsRejected(flags: ReadonlySet<string>): void {
  for (const rejected of SANITIZED_CLI_REJECTED_FLAGS) {
    if (flags.has(rejected)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Production CLI flag --${rejected} is not permitted`,
      );
    }
  }
}

export function listSanitizedProductionCliRejectedFlags(): readonly string[] {
  return SANITIZED_CLI_REJECTED_FLAGS;
}

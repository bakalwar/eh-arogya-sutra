import { TerminologyPackError } from './errors.js';
import { EMPTY_PACK_APPROVAL_POSTURE, EMPTY_PACK_STATUS, type TerminologyPack } from './types.js';

export const OWNER_APPROVAL_PREFIX = 'EHAS2_F3D2_PACK_APPROVAL' as const;
export const TEST_APPROVAL_PREFIX = 'EHAS2_F3D2_PACK_TEST' as const;

export function bindOwnerApprovalToken(
  packId: string,
  packVersion: string,
  contentChecksum: string,
): string {
  return `${OWNER_APPROVAL_PREFIX}:${packId}:${packVersion}:${contentChecksum}`;
}

export function bindSyntheticTestToken(
  packId: string,
  packVersion: string,
  contentChecksum: string,
): string {
  return `${TEST_APPROVAL_PREFIX}:${packId}:${packVersion}:${contentChecksum}`;
}

export function assertApprovalBinding(pack: TerminologyPack, allowSynthetic: boolean): void {
  if (pack.status === EMPTY_PACK_STATUS) {
    if (pack.ownerApprovalToken !== EMPTY_PACK_APPROVAL_POSTURE) {
      throw new TerminologyPackError('TERMINOLOGY_PACK_APPROVAL_INVALID', meta(pack));
    }
    if (pack.entries.length !== 0) {
      throw new TerminologyPackError('TERMINOLOGY_PACK_APPROVAL_INVALID', meta(pack));
    }
    return;
  }
  if (pack.status === 'SYNTHETIC_TEST_ONLY') {
    if (!allowSynthetic) {
      throw new TerminologyPackError('TERMINOLOGY_PACK_PRODUCTION_SYNTHETIC_FORBIDDEN', meta(pack));
    }
    const expected = bindSyntheticTestToken(pack.packId, pack.packVersion, pack.contentChecksum);
    if (pack.ownerApprovalToken !== expected) {
      throw new TerminologyPackError('TERMINOLOGY_PACK_APPROVAL_INVALID', meta(pack));
    }
    return;
  }
  const expected = bindOwnerApprovalToken(pack.packId, pack.packVersion, pack.contentChecksum);
  if (pack.ownerApprovalToken !== expected) {
    throw new TerminologyPackError('TERMINOLOGY_PACK_APPROVAL_INVALID', meta(pack));
  }
}

function meta(pack: TerminologyPack) {
  return {
    packId: pack.packId,
    packVersion: pack.packVersion,
    entryCount: pack.entries.length,
  };
}

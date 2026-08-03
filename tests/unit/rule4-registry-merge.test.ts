import {
  mergeRule4RegistryEntries,
  Rule4RegistryMergeError,
} from '../../packages/clinical-contracts/src/rule4/registryMerge.ts';
import { describe, expect, it } from 'vitest';

describe('Rule 4 registry merge', () => {
  it('dedupes identical metadata', () => {
    const entry = { code: 'X', namespace: 'reason' as const, source: 's' };
    expect(mergeRule4RegistryEntries([entry], [entry])).toHaveLength(1);
  });

  it('fails on namespace conflict', () => {
    expect(() =>
      mergeRule4RegistryEntries(
        [{ code: 'X', namespace: 'reason', source: 's' }],
        [{ code: 'X', namespace: 'limitation', source: 's' }],
      ),
    ).toThrow(Rule4RegistryMergeError);
  });
});

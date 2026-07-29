import type { EHAS2ClinicalResultShell } from '@ehas2/clinical-contracts';

export const ENGINE_ADAPTER_STATUS = 'NOT_IMPLEMENTED' as const;

/**
 * EHAS2ClinicalEngineAdapter — implemented Phase 6.
 * Phase 1A: explicit not-implemented boundary (no silent fallback, no fake success).
 */
export class EHAS2ClinicalEngineAdapter {
  analyzeComplete(_input: unknown): never {
    const err = new Error('EHAS2ClinicalEngineAdapter: NOT_IMPLEMENTED (Phase 6)');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }

  static shell(): EHAS2ClinicalResultShell {
    return {
      _phase: '1a-shell',
      status: 'NOT_IMPLEMENTED',
      engineVersionInfo: {
        engineVersion: 'not-integrated',
        ruleVersion: 'not-integrated',
        diseaseDataVersion: 'not-copied',
        medicineDataVersion: 'not-copied',
      },
    };
  }
}

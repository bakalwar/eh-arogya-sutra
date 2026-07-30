import { describe, expect, it } from 'vitest';
import {
  EHAS2_API_NAMESPACE,
  EHAS2_STORAGE_PREFIX,
  FoundationStatus,
} from '../../packages/shared/src/index.ts';
import {
  EHAS2ClinicalEngineAdapter,
  ENGINE_ADAPTER_STATUS,
} from '../../packages/engine-adapter/src/index.ts';
import { DATABASE_PACKAGE_STATUS } from '../../packages/database/src/index.ts';
import { CLINICAL_CONTRACTS_STATUS } from '../../packages/clinical-contracts/src/index.ts';

describe('EHAS2 foundation', () => {
  it('uses EHAS2 storage prefix constant', () => {
    expect(EHAS2_STORAGE_PREFIX).toBe('ehas2:');
  });

  it('exposes versioned API namespace', () => {
    expect(EHAS2_API_NAMESPACE).toBe('/api/eh-as-2/v1');
  });

  it('placeholder modules advertise explicit not-ready codes', () => {
    expect(FoundationStatus.NOT_IMPLEMENTED).toBe('NOT_IMPLEMENTED');
    expect(FoundationStatus.NOT_READY).toBe('NOT_READY');
    expect(FoundationStatus.DATA_PACKAGE_NOT_INSTALLED).toBe('DATA_PACKAGE_NOT_INSTALLED');
    expect(ENGINE_ADAPTER_STATUS).toBe('NOT_IMPLEMENTED');
    expect(DATABASE_PACKAGE_STATUS).toBe('PROFILE_PERSISTENCE');
    expect(CLINICAL_CONTRACTS_STATUS).toBe('NOT_READY');
  });

  it('engine adapter shell does not fabricate clinical success', () => {
    const shell = EHAS2ClinicalEngineAdapter.shell();
    expect(shell.status).toBe('NOT_IMPLEMENTED');
    expect(shell.engineVersionInfo.engineVersion).toBe('not-integrated');
  });

  it('engine adapter analyzeComplete throws NOT_IMPLEMENTED', () => {
    const adapter = new EHAS2ClinicalEngineAdapter();
    expect(() => adapter.analyzeComplete({})).toThrow(/NOT_IMPLEMENTED/);
  });
});

import { describe, expect, it } from 'vitest';
import {
  FaultInjectingObjectStore,
  FORBIDDEN_OBJECT_STORE_METHODS,
  MemoryFakeObjectStore,
  UnavailableObjectStore,
  assertNoPublicObjectStoreApi,
  EVIDENCE_PRODUCTION_OBJECT_STORE,
} from '../../packages/evidence-ingest/src/index.ts';

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

describe('F2A object-store contract', () => {
  it('memory adapter is private, unencrypted, and not production', async () => {
    const store = new MemoryFakeObjectStore();
    expect(store.productionReady).toBe(false);
    expect(EVIDENCE_PRODUCTION_OBJECT_STORE).toBe(false);
    expect(store.publicUrlsForbidden).toBe(true);
    expect(store.encryptionPosture).toBe('NOT_PRODUCTION');
    expect(store.capabilities.publicUrl).toBe(false);
    expect(store.capabilities.cdn).toBe(false);
    assertNoPublicObjectStoreApi(store);
    for (const name of FORBIDDEN_OBJECT_STORE_METHODS) {
      expect(name in store).toBe(false);
    }
    await store.put('ehas2/ok', PNG);
    expect(await store.exists('ehas2/ok')).toBe(true);
    const head = await store.head('ehas2/ok');
    expect(head.exists).toBe(true);
    expect(head.encryptionPosture).toBe('NOT_PRODUCTION');
    const scanned = await store.readForMalwareScan('ehas2/ok');
    expect(scanned?.byteLength).toBe(PNG.length);
    await store.delete('ehas2/ok');
    expect(await store.exists('ehas2/ok')).toBe(false);
    const health = await store.health();
    expect(health.ok).toBe(true);
    expect(health.productionReady).toBe(false);
    expect(health.publicUrls).toBe(false);
  });

  it('putStream commits only after the stream completes', async () => {
    const store = new MemoryFakeObjectStore();
    async function* body() {
      yield PNG.subarray(0, 10);
      yield PNG.subarray(10);
    }
    await store.putStream('ehas2/stream', body());
    expect(await store.exists('ehas2/stream')).toBe(true);
  });

  it('abortPartial removes incomplete objects', async () => {
    const inner = new MemoryFakeObjectStore();
    const store = new FaultInjectingObjectStore(inner, { failPutAfterBytes: 4 });
    async function* body() {
      yield PNG;
    }
    await expect(store.putStream('ehas2/partial', body())).rejects.toMatchObject({
      code: 'STORE_UNAVAILABLE',
    });
    expect(await inner.exists('ehas2/partial')).toBe(false);
    await store.abortPartial('ehas2/partial');
    expect(await inner.exists('ehas2/partial')).toBe(false);
  });

  it('unavailable adapter fails closed and is not production', async () => {
    const store = new UnavailableObjectStore();
    expect(store.productionReady).toBe(false);
    await expect(store.put('ehas2/x', PNG)).rejects.toMatchObject({ code: 'STORE_UNAVAILABLE' });
    const health = await store.health();
    expect(health.ok).toBe(false);
    expect(health.productionReady).toBe(false);
  });
});

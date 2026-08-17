import { TEST_ADAPTER_ENCRYPTION, assertEncryptionPosture } from './encryption.js';
import {
  FORBIDDEN_OBJECT_STORE_METHODS,
  MAX_EVIDENCE_BYTES,
  type EncryptionPosture,
  type EvidenceObjectStore,
  type ObjectStoreCapabilities,
  type ObjectStoreHead,
  type ObjectStoreHealth,
} from './types.js';

const CAPABILITIES: ObjectStoreCapabilities = {
  publicUrl: false,
  cdn: false,
  permanentRetention: false,
  browserDownloadRoute: false,
};

function assertObjectKey(objectKey: string): void {
  if (objectKey.includes('..') || objectKey.includes('\\')) {
    throw new Error('OBJECT_KEY_REJECTED');
  }
}

async function collectStream(body: AsyncIterable<Uint8Array>): Promise<Uint8Array> {
  const parts: Buffer[] = [];
  let size = 0;
  for await (const chunk of body) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > MAX_EVIDENCE_BYTES) {
      throw new Error('SIZE_REJECTED');
    }
    parts.push(buf);
  }
  return Buffer.concat(parts);
}

function health(ok: boolean, posture: EncryptionPosture): ObjectStoreHealth {
  return {
    ok,
    productionReady: false,
    publicUrls: false,
    durableProduction: false,
    encryptionPosture: posture,
  };
}

/**
 * In-process fake store for tests/local only.
 * Not production storage. Not encrypted. Not horizontally shared.
 */
export class MemoryFakeObjectStore implements EvidenceObjectStore {
  readonly provider = 'memory_fake' as const;
  readonly productionReady = false as const;
  readonly publicUrlsForbidden = true as const;
  readonly encryptionPosture = TEST_ADAPTER_ENCRYPTION.posture;
  readonly capabilities = CAPABILITIES;

  private readonly blobs = new Map<string, Uint8Array>();

  constructor() {
    assertEncryptionPosture({
      posture: this.encryptionPosture,
      productionReady: this.productionReady,
      kmsAvailable: false,
    });
  }

  async put(objectKey: string, bytes: Uint8Array): Promise<void> {
    assertObjectKey(objectKey);
    this.blobs.set(objectKey, Uint8Array.from(bytes));
  }

  async putStream(objectKey: string, body: AsyncIterable<Uint8Array>): Promise<void> {
    assertObjectKey(objectKey);
    try {
      const bytes = await collectStream(body);
      this.blobs.set(objectKey, Uint8Array.from(bytes));
    } catch (err) {
      this.blobs.delete(objectKey);
      throw err;
    }
  }

  async readForMalwareScan(
    objectKey: string,
    maxBytes = MAX_EVIDENCE_BYTES,
  ): Promise<Uint8Array | null> {
    const found = this.blobs.get(objectKey);
    if (!found) return null;
    if (found.byteLength > maxBytes) {
      return Uint8Array.from(found.subarray(0, maxBytes));
    }
    return Uint8Array.from(found);
  }

  async delete(objectKey: string): Promise<void> {
    this.blobs.delete(objectKey);
  }

  async exists(objectKey: string): Promise<boolean> {
    return this.blobs.has(objectKey);
  }

  async head(objectKey: string): Promise<ObjectStoreHead> {
    const found = this.blobs.get(objectKey);
    return {
      exists: Boolean(found),
      byteSize: found ? found.byteLength : null,
      encryptionPosture: this.encryptionPosture,
    };
  }

  async abortPartial(objectKey: string): Promise<void> {
    this.blobs.delete(objectKey);
  }

  async health(): Promise<ObjectStoreHealth> {
    return health(true, this.encryptionPosture);
  }

  /** Test helper — not a canonical record. */
  size(): number {
    return this.blobs.size;
  }
}

/** Deterministic fault injection — still not a production adapter. */
export class FaultInjectingObjectStore implements EvidenceObjectStore {
  readonly provider = 'memory_fault' as const;
  readonly productionReady = false as const;
  readonly publicUrlsForbidden = true as const;
  readonly encryptionPosture = TEST_ADAPTER_ENCRYPTION.posture;
  readonly capabilities = CAPABILITIES;

  constructor(
    private readonly inner: EvidenceObjectStore,
    private readonly faults: {
      failPut?: boolean;
      failPutAfterBytes?: number;
      failDeleteKeys?: Set<string>;
      failExists?: boolean;
    } = {},
  ) {
    assertEncryptionPosture({
      posture: this.encryptionPosture,
      productionReady: this.productionReady,
      kmsAvailable: false,
    });
  }

  failDeletes(keys: Iterable<string>): void {
    this.faults.failDeleteKeys = new Set(keys);
  }

  async put(objectKey: string, bytes: Uint8Array): Promise<void> {
    if (this.faults.failPut)
      throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
    await this.inner.put(objectKey, bytes);
  }

  async putStream(objectKey: string, body: AsyncIterable<Uint8Array>): Promise<void> {
    if (this.faults.failPut) {
      await this.abortPartial(objectKey);
      throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
    }
    const limit = this.faults.failPutAfterBytes;
    if (limit == null) {
      await this.inner.putStream(objectKey, body);
      return;
    }
    const parts: Buffer[] = [];
    let size = 0;
    try {
      for await (const chunk of body) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buf.length;
        parts.push(buf);
        if (size > limit) {
          throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
        }
      }
      await this.inner.put(objectKey, Buffer.concat(parts));
    } catch (err) {
      await this.abortPartial(objectKey);
      throw err;
    }
  }

  async readForMalwareScan(objectKey: string, maxBytes?: number): Promise<Uint8Array | null> {
    return this.inner.readForMalwareScan(objectKey, maxBytes);
  }

  async delete(objectKey: string): Promise<void> {
    if (this.faults.failDeleteKeys?.has(objectKey)) {
      throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
    }
    await this.inner.delete(objectKey);
  }

  async exists(objectKey: string): Promise<boolean> {
    if (this.faults.failExists) {
      throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
    }
    return this.inner.exists(objectKey);
  }

  async head(objectKey: string): Promise<ObjectStoreHead> {
    return this.inner.head(objectKey);
  }

  async abortPartial(objectKey: string): Promise<void> {
    await this.inner.abortPartial(objectKey);
  }

  async health(): Promise<ObjectStoreHealth> {
    return health(!this.faults.failPut && !this.faults.failExists, this.encryptionPosture);
  }
}

export class UnavailableObjectStore implements EvidenceObjectStore {
  readonly provider = 'unavailable' as const;
  readonly productionReady = false as const;
  readonly publicUrlsForbidden = true as const;
  readonly encryptionPosture = TEST_ADAPTER_ENCRYPTION.posture;
  readonly capabilities = CAPABILITIES;

  constructor() {
    assertEncryptionPosture({
      posture: this.encryptionPosture,
      productionReady: this.productionReady,
      kmsAvailable: false,
    });
  }

  async put(): Promise<void> {
    throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
  }

  async putStream(): Promise<void> {
    throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
  }

  async readForMalwareScan(): Promise<Uint8Array | null> {
    throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
  }

  async delete(): Promise<void> {
    throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
  }

  async exists(): Promise<boolean> {
    throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
  }

  async head(): Promise<ObjectStoreHead> {
    throw Object.assign(new Error('STORE_UNAVAILABLE'), { code: 'STORE_UNAVAILABLE' });
  }

  async abortPartial(): Promise<void> {
    return;
  }

  async health(): Promise<ObjectStoreHealth> {
    return health(false, this.encryptionPosture);
  }
}

export function assertNoPublicObjectStoreApi(store: object): void {
  const names = new Set([
    ...Object.keys(store),
    ...Object.getOwnPropertyNames(Object.getPrototypeOf(store)),
  ]);
  for (const method of FORBIDDEN_OBJECT_STORE_METHODS) {
    if (names.has(method)) {
      throw new Error(`PUBLIC_URL_API_FORBIDDEN:${method}`);
    }
  }
}

let defaultStore: MemoryFakeObjectStore | null = null;

export function getMemoryFakeObjectStore(): MemoryFakeObjectStore {
  if (!defaultStore) defaultStore = new MemoryFakeObjectStore();
  return defaultStore;
}

export function resetMemoryFakeObjectStore(): void {
  defaultStore = new MemoryFakeObjectStore();
}

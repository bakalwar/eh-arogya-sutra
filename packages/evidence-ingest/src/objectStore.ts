import type { EvidenceObjectStore } from './types.js';

/**
 * In-process fake store for tests/local only.
 * Not production storage. Not encrypted. Not horizontally shared.
 */
export class MemoryFakeObjectStore implements EvidenceObjectStore {
  readonly provider = 'memory_fake' as const;
  readonly productionReady = false as const;
  readonly publicUrlsForbidden = true as const;

  private readonly blobs = new Map<string, Uint8Array>();

  async put(objectKey: string, bytes: Uint8Array): Promise<void> {
    if (objectKey.includes('..') || objectKey.includes('\\')) {
      throw new Error('OBJECT_KEY_REJECTED');
    }
    this.blobs.set(objectKey, Uint8Array.from(bytes));
  }

  async get(objectKey: string): Promise<Uint8Array | null> {
    const found = this.blobs.get(objectKey);
    return found ? Uint8Array.from(found) : null;
  }

  async delete(objectKey: string): Promise<void> {
    this.blobs.delete(objectKey);
  }

  async exists(objectKey: string): Promise<boolean> {
    return this.blobs.has(objectKey);
  }

  /** Test helper — not a canonical record. */
  size(): number {
    return this.blobs.size;
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

import type { IncomingMessage } from 'node:http';

export async function* requestBodyChunks(req: IncomingMessage): AsyncGenerator<Uint8Array> {
  for await (const chunk of req) {
    yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
  }
}

export function parseContentLengthHeader(value: string | undefined): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

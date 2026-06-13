import { ApiError } from '@/lib/api/client';
import { appEnv, resolvePublicNodeApiBase } from '@/lib/api/config';
import { getValidToken } from '@/lib/session/tokenManager';

/**
 * POST multipart or JSON directly to Railway Node API (production file uploads).
 * Falls back to same-origin Vercel route on CORS/network errors.
 */
export async function postToNodeApiDirect<T>(
  path: string,
  body: BodyInit,
  timeoutMs = 600_000
): Promise<T> {
  const directBase = resolvePublicNodeApiBase();
  const canDirect =
    typeof window !== 'undefined' && appEnv === 'production' && Boolean(directBase);

  if (!canDirect) {
    throw new ApiError('Direct node API not available in this environment', 0);
  }

  const token = await getValidToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${directBase}${path}`, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
      credentials: 'omit',
    });

    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      throw new ApiError(
        (data as { message?: string })?.message || `Request failed (${res.status})`,
        res.status,
        data
      );
    }

    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('Request timed out — server busy, try again.', 408);
    }
    throw new ApiError(e instanceof Error ? e.message : 'Network error', 0);
  } finally {
    window.clearTimeout(timer);
  }
}

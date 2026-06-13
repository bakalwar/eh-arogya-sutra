import { getValidToken, clearSession, refreshAccessToken, hasLocalDevAuthGrace } from '@/lib/session/tokenManager';

const DEFAULT_TIMEOUT_MS = 30_000;
const LONG_TIMEOUT_MS = 600_000;
const SUMMARY_TIMEOUT_MS = 600_000;

const LONG_PATHS = [
  '/api/search/clinical-analysis',
  '/api/search/analyze-complete',
  '/api/search/analyze',
  '/api/reports/analyze',
];
const SUMMARY_PATHS = ['/api/summary/eh-api', '/api/summary/generate', '/api/summary/expert-clinical'];

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function timeoutForPath(path: string): number {
  if (SUMMARY_PATHS.some((p) => path.includes(p))) return SUMMARY_TIMEOUT_MS;
  if (LONG_PATHS.some((p) => path.includes(p))) return LONG_TIMEOUT_MS;
  return DEFAULT_TIMEOUT_MS;
}

function isAuthUrl(path: string) {
  return path.includes('/api/auth/login') || path.includes('/api/auth/refresh');
}

export interface ApiRequestOptions {
  method?: string;
  body?: BodyInit | Record<string, unknown> | null;
  auth?: boolean;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
  _retry401 = false
): Promise<T> {
  const { method = 'GET', body = null, auth = true, headers = {} } = options;
  const timeoutMs = options.timeoutMs ?? timeoutForPath(path);

  const reqHeaders: Record<string, string> = { ...headers };

  if (auth && !isAuthUrl(path)) {
    const token = await getValidToken();
    if (token) reqHeaders.Authorization = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body != null) {
    reqHeaders['Content-Type'] = 'application/json';
    payload = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(path, {
      method,
      headers: reqHeaders,
      body: payload,
      signal: controller.signal,
      credentials: 'same-origin',
    });

    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : null;

    if (res.status === 401 && auth && !isAuthUrl(path)) {
      if (!_retry401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return apiRequest<T>(path, options, true);
        }
      }
      if (!hasLocalDevAuthGrace()) {
        clearSession();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }

    if (!res.ok) {
      const msg =
        (data as { message?: string })?.message ||
        `Request failed (${res.status})`;
      throw new ApiError(msg, res.status, data);
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

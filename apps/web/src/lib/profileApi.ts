/** Typed client for Phase 3D profile APIs — never invents a logged-in doctor. */

import { EHAS2_API_NAMESPACE } from '@ehas2/shared';

export type ProfileApiErrorCode =
  | 'AUTH_NOT_CONNECTED'
  | 'PERMISSION_DENIED'
  | 'ACCESS_DENIED'
  | 'TENANT_CONTEXT_REQUIRED'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NOT_IMPLEMENTED'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'INTERNAL_ERROR';

export type ProfileApiResult<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; code: ProfileApiErrorCode; message: string; requestId: string };

function apiBase(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_EHAS2_API_BASE) {
    return process.env.NEXT_PUBLIC_EHAS2_API_BASE.replace(/\/$/, '');
  }
  return '';
}

export async function profileApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ProfileApiResult<T>> {
  const url = `${apiBase()}${EHAS2_API_NAMESPACE}${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    });
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: T;
      code?: string;
      message?: string;
      requestId?: string;
    };
    const requestId = body.requestId ?? res.headers.get('x-request-id') ?? 'unknown';
    if (!res.ok || body.success === false) {
      return {
        ok: false,
        code: (body.code as ProfileApiErrorCode) || 'INTERNAL_ERROR',
        message: body.message ?? 'Request failed',
        requestId,
      };
    }
    return { ok: true, data: body.data as T, requestId };
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'Profile API is unreachable.',
      requestId: 'unknown',
    };
  }
}

/** Clearly labelled synthetic demo — never sent to PostgreSQL. */
export const SYNTHETIC_DEMO_PROFILE = {
  label: 'SYNTHETIC_DEMO',
  displayName: 'Synthetic Demo Doctor',
  professionalTitle: 'BHMS (demo label only)',
  clinicName: 'Synthetic Demo Clinic',
  note: 'Preview illustration only. Not a real doctor identity. Not persisted.',
} as const;

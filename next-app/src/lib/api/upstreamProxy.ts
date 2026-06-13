import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/tokens';
import { resolveNodeProxyBase } from '@/lib/api/nodeProxyBase';

export interface TrustedUser {
  id: string;
  role: string;
}

function signBodyHmac(body: string): string | null {
  const secret = process.env.HMAC_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update(body).digest('hex');
}

export function resolveProxySecret(): string {
  return String(process.env.EH_INTERNAL_PROXY_SECRET || process.env.JWT_SECRET || '').trim();
}

function applyTrustedUserHeaders(headers: Headers, user: TrustedUser) {
  const proxySecret = resolveProxySecret();
  if (!proxySecret) return;
  headers.set('x-eh-proxy-secret', proxySecret);
  headers.set('x-eh-user-id', user.id);
  headers.set('x-eh-user-role', user.role || 'doctor');
}

/**
 * Proxy browser API calls to Railway Node backend.
 * When `trustedUser` is set (JWT already verified on Vercel), Railway accepts
 * x-eh-proxy-* headers — no Bearer mismatch between hosts.
 */
export async function proxyToUpstream(
  request: NextRequest,
  apiPath: string,
  trustedUser?: TrustedUser
) {
  const base = resolveNodeProxyBase();
  const target = `${base}/api/${apiPath}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type') || '';
  const isMultipart = contentType.includes('multipart/form-data');

  if (trustedUser) {
    applyTrustedUserHeaders(headers, trustedUser);
  } else {
    const authorization = request.headers.get('authorization');
    if (authorization?.startsWith('Bearer ')) {
      headers.set('authorization', authorization);
      const token = authorization.slice(7).trim();
      const proxySecret = resolveProxySecret();
      if (proxySecret) {
        try {
          const payload = verifyAccessToken(token);
          if (payload.id) {
            applyTrustedUserHeaders(headers, {
              id: String(payload.id),
              role: String(payload.role || 'doctor'),
            });
          }
        } catch {
          /* Railway may still accept Bearer when secrets match */
        }
      }
    }
  }

  const refresh = request.headers.get('x-refresh-token');
  if (refresh) headers.set('x-refresh-token', refresh);

  let body: BodyInit | undefined;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (isMultipart) {
      // Rebuild FormData — raw arrayBuffer passthrough often breaks multipart boundaries on Vercel.
      const form = await request.formData();
      const upstreamForm = new FormData();
      for (const [key, value] of form.entries()) {
        upstreamForm.append(key, value);
      }
      body = upstreamForm;
    } else {
      if (!isMultipart && contentType) headers.set('content-type', contentType);
      const bodyText = await request.text();
      body = bodyText;
      const sig = signBodyHmac(bodyText);
      if (sig) headers.set('x-api-signature', sig);
    }
  }

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  });

  const responseBody = await upstream.arrayBuffer();
  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) responseHeaders.set('content-type', upstreamType);

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

/**
 * Same-origin API route helper — validates JWT on Vercel then proxies with trusted headers.
 */
export async function proxyAuthenticatedRoute(
  request: NextRequest,
  apiPath: string,
  user: TrustedUser
) {
  return proxyToUpstream(request, apiPath, user);
}

import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/tokens';
import { resolveNodeProxyBase } from '@/lib/api/nodeProxyBase';

function signBodyHmac(body: string): string | null {
  const secret = process.env.HMAC_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update(body).digest('hex');
}

function resolveProxySecret(): string {
  return String(process.env.EH_INTERNAL_PROXY_SECRET || process.env.JWT_SECRET || '').trim();
}

/**
 * Proxy browser API calls to Railway Node backend.
 * Validates JWT on Vercel, then forwards trusted user headers so Railway auth succeeds.
 */
export async function proxyToUpstream(request: NextRequest, apiPath: string) {
  const base = resolveNodeProxyBase();
  const target = `${base}/api/${apiPath}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const authorization = request.headers.get('authorization');
  const proxySecret = resolveProxySecret();

  if (authorization?.startsWith('Bearer ')) {
    headers.set('authorization', authorization);
    const token = authorization.slice(7).trim();
    if (proxySecret) {
      try {
        const payload = verifyAccessToken(token);
        if (payload.id) {
          headers.set('x-eh-proxy-secret', proxySecret);
          headers.set('x-eh-user-id', String(payload.id));
          headers.set('x-eh-user-role', String(payload.role || 'doctor'));
        }
      } catch {
        /* Railway may still accept Bearer directly when secrets match */
      }
    }
  }

  const refresh = request.headers.get('x-refresh-token');
  if (refresh) headers.set('x-refresh-token', refresh);

  let body: BodyInit | undefined;
  let bodyTextForHmac: string | undefined;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const isMultipart = (contentType || '').includes('multipart/form-data');
    if (isMultipart) {
      body = await request.arrayBuffer();
    } else {
      bodyTextForHmac = await request.text();
      body = bodyTextForHmac;
      const sig = signBodyHmac(bodyTextForHmac);
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

import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { resolveNodeProxyBase } from '@/lib/api/nodeProxyBase';

function signBodyHmac(body: string): string | null {
  const secret = process.env.HMAC_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Proxy browser API calls to Railway Node backend.
 * Forwards Authorization; adds server-side HMAC when configured (legacy Railway).
 */
export async function proxyToUpstream(request: NextRequest, apiPath: string) {
  const base = resolveNodeProxyBase();
  const target = `${base}/api/${apiPath}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);

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

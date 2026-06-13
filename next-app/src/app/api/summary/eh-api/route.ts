import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth/requireApiAuth';
import { resolveNodeProxyBase } from '@/lib/api/nodeProxyBase';
import { resolveProxySecret } from '@/lib/api/upstreamProxy';

export const maxDuration = 300;

/** Server-side proxy — browser stays same-origin (no CORS); Railway gets trusted auth headers. */
export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (auth instanceof Response) return auth;

  const bodyText = await request.text();
  const base = resolveNodeProxyBase();
  const proxySecret = resolveProxySecret();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (proxySecret) {
    headers['x-eh-proxy-secret'] = proxySecret;
    headers['x-eh-user-id'] = auth.id;
    headers['x-eh-user-role'] = auth.role || 'doctor';
  } else {
    const authorization = request.headers.get('authorization');
    if (authorization) headers.Authorization = authorization;
  }

  try {
    const upstream = await fetch(`${base}/api/summary/eh-api`, {
      method: 'POST',
      headers,
      body: bodyText,
      cache: 'no-store',
    });

    const responseBody = await upstream.text();
    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) responseHeaders.set('content-type', upstreamType);

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[summary/eh-api] upstream error:', err);
    return NextResponse.json(
      {
        success: false,
        message:
          'Summary service unreachable — check Railway backend and EH Python API (:8005).',
      },
      { status: 502 }
    );
  }
}

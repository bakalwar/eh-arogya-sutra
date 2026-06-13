import { NextRequest, NextResponse } from 'next/server';
import { resolveNodeProxyBase } from '@/lib/api/nodeProxyBase';

export async function proxyAuthToNode(request: NextRequest, tail: string) {
  const base = resolveNodeProxyBase();
  const target = `${base}/api/${tail}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: await request.text(),
    cache: 'no-store',
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}

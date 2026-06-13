import { NextRequest, NextResponse } from 'next/server';
import { resolveNodeProxyBase } from '@/lib/api/nodeProxyBase';

type RouteCtx = { params: Promise<{ path: string[] }> };

async function proxyToNode(request: NextRequest, segments: string[]) {
  const base = resolveNodeProxyBase();
  const tail = segments.map(encodeURIComponent).join('/');
  const target = `${base}/api/${tail}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);
  const refresh = request.headers.get('x-refresh-token');
  if (refresh) headers.set('x-refresh-token', refresh);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const body = await upstream.arrayBuffer();
  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) responseHeaders.set('content-type', upstreamType);

  return new NextResponse(body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxyToNode(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

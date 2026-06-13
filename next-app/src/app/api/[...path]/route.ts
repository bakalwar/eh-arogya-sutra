import { NextRequest } from 'next/server';
import { proxyToUpstream } from '@/lib/api/upstreamProxy';

type RouteCtx = { params: Promise<{ path: string[] }> };

const LOCAL_HANDLERS = new Set(['auth', 'patients', 'branding', 'summary']);

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  if (LOCAL_HANDLERS.has(path[0])) {
    return Response.json(
      { success: false, message: `Route not found: /api/${path.join('/')}` },
      { status: 404 }
    );
  }
  return proxyToUpstream(request, path.map(encodeURIComponent).join('/'));
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

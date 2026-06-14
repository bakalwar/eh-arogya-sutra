import { NextRequest } from 'next/server';
import { requireApiAuth } from '@/lib/auth/requireApiAuth';
import { proxyToUpstream } from '@/lib/api/upstreamProxy';

type RouteCtx = { params: Promise<{ path: string[] }> };

/** Routes with dedicated handlers under src/app/api/<name>/ — never proxy via catch-all. */
const LOCAL_HANDLERS = new Set(['auth', 'patients', 'branding']);

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  const apiPath = path.map(encodeURIComponent).join('/');

  // Summary first — must never 404 here (CaseSummary → postClinicalSummary)
  if (path[0] === 'summary') {
    const auth = requireApiAuth(request);
    if (auth instanceof Response) return auth;
    return proxyToUpstream(request, apiPath, auth);
  }

  if (LOCAL_HANDLERS.has(path[0])) {
    return Response.json(
      { success: false, message: `Route not found: /api/${apiPath}` },
      { status: 404 }
    );
  }

  return proxyToUpstream(request, apiPath);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

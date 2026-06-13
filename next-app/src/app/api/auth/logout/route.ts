import { NextRequest } from 'next/server';
import { hasAuthDatabase } from '@/lib/auth/pg';
import { revokeRefreshToken } from '@/lib/auth/tokens';
import { proxyToUpstream } from '@/lib/api/upstreamProxy';

export async function POST(request: NextRequest) {
  if (!hasAuthDatabase()) {
    return proxyToUpstream(request, 'auth/logout');
  }

  try {
    const body = (await request.json()) as { refreshToken?: string };
    if (body?.refreshToken) {
      await revokeRefreshToken(body.refreshToken);
    }
    return Response.json({ success: true, message: 'Logged out' });
  } catch {
    return Response.json({ success: true, message: 'Logged out' });
  }
}

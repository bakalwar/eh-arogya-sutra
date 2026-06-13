import { NextRequest } from 'next/server';
import { hasAuthDatabase } from '@/lib/auth/pg';
import {
  ACCESS_EXPIRE,
  signAccessToken,
  validateStoredRefresh,
  verifyRefreshJwt,
} from '@/lib/auth/tokens';
import { proxyAuthToNode } from '@/lib/auth/proxyToNode';

export async function POST(request: NextRequest) {
  if (!hasAuthDatabase()) {
    return proxyAuthToNode(request, 'auth/refresh');
  }

  try {
    const body = (await request.json()) as { refreshToken?: string };
    const raw = body?.refreshToken || '';
    if (!raw) {
      return Response.json({ success: false, message: 'refreshToken required.' }, { status: 400 });
    }

    try {
      verifyRefreshJwt(raw);
    } catch {
      return Response.json({ success: false, message: 'Invalid refresh token.' }, { status: 401 });
    }

    const user = await validateStoredRefresh(raw);
    if (!user) {
      return Response.json(
        { success: false, message: 'Refresh token revoked or expired.' },
        { status: 401 }
      );
    }

    const accessToken = signAccessToken(user);
    return Response.json({
      success: true,
      token: accessToken,
      accessToken,
      expiresIn: ACCESS_EXPIRE,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Refresh failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

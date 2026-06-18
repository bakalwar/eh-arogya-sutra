import { NextRequest } from 'next/server';
import { handleMe } from '@/lib/auth/handlers';
import { hasAuthDatabase } from '@/lib/auth/pg';
import { requireApiAuth } from '@/lib/auth/requireApiAuth';
import { proxyAuthToNode } from '@/lib/auth/proxyToNode';

export async function GET(request: NextRequest) {
  if (!hasAuthDatabase()) {
    return proxyAuthToNode(request, 'auth/me');
  }
  const auth = requireApiAuth(request);
  if (auth instanceof Response) return auth;
  try {
    return handleMe(auth.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not load profile.';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

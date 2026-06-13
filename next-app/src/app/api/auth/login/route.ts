import { NextRequest } from 'next/server';
import { hasAuthDatabase } from '@/lib/auth/pg';
import { handleLogin } from '@/lib/auth/handlers';
import { proxyAuthToNode } from '@/lib/auth/proxyToNode';

export async function POST(request: NextRequest) {
  if (!hasAuthDatabase()) {
    return proxyAuthToNode(request, 'auth/login');
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    return handleLogin(body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Login failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

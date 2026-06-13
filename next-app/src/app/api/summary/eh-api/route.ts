import { NextRequest } from 'next/server';
import { requireApiAuth } from '@/lib/auth/requireApiAuth';
import { proxyAuthenticatedRoute } from '@/lib/api/upstreamProxy';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (auth instanceof Response) return auth;
  return proxyAuthenticatedRoute(request, 'summary/eh-api', auth);
}

import { NextRequest } from 'next/server';
import { requireApiAuth } from '@/lib/auth/requireApiAuth';
import { proxyToUpstream } from '@/lib/api/upstreamProxy';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const auth = requireApiAuth(request);
  if (auth instanceof Response) return auth;
  return proxyToUpstream(request, 'summary/eh-api');
}

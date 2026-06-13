import { NextRequest } from 'next/server';
import { proxyToUpstream } from '@/lib/api/upstreamProxy';

export async function GET(request: NextRequest) {
  return proxyToUpstream(request, 'branding');
}

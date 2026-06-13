import { NextRequest } from 'next/server';
import { proxyToUpstream } from '@/lib/api/upstreamProxy';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  return proxyToUpstream(request, 'search/analyze');
}

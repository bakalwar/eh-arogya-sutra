import { NextRequest } from 'next/server';
import { proxyToUpstream } from '@/lib/api/upstreamProxy';

export const maxDuration = 600;

export async function POST(request: NextRequest) {
  return proxyToUpstream(request, 'search/clinical-analysis');
}

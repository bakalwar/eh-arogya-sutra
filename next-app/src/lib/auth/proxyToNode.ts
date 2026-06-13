import { NextRequest, NextResponse } from 'next/server';
import { proxyToUpstream } from '@/lib/api/upstreamProxy';

export async function proxyAuthToNode(request: NextRequest, tail: string) {
  return proxyToUpstream(request, tail);
}

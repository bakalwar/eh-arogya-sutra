import { NextRequest, NextResponse } from 'next/server';
import { resolveNodeProxyBase } from '@/lib/api/nodeProxyBase';

export async function GET() {
  const base = resolveNodeProxyBase();
  const res = await fetch(`${base}/health`, { cache: 'no-store' });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
  });
}

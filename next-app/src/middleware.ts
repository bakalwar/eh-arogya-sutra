import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAMES } from '@/lib/session/tokenManager';

const appEnv =
  process.env.NEXT_PUBLIC_APP_ENV ||
  (process.env.NODE_ENV === 'production' ? 'production' : 'local');

const IS_LOCAL =
  appEnv === 'local' ||
  process.env.EH_LOCAL_DEV === '1';

function hasSessionCookies(request: NextRequest) {
  const c = request.cookies;
  return (
    c.has(SESSION_COOKIE_NAMES.sessionMarker) ||
    c.has(SESSION_COOKIE_NAMES.access) ||
    c.has(SESSION_COOKIE_NAMES.refresh) ||
    c.has(SESSION_COOKIE_NAMES.localAuth)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (IS_LOCAL) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/reports', request.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/login' && hasSessionCookies(request)) {
    const next = request.nextUrl.searchParams.get('next');
    const dest = next && next.startsWith('/') ? next : '/reports';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (pathname === '/signup' && hasSessionCookies(request)) {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup', '/overview', '/reports', '/records', '/symptom-search', '/case-summary', '/clinic', '/admin'],
};

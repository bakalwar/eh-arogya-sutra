import { NextResponse, type NextRequest } from 'next/server';
import { isLocalPreviewAllowed, PREVIEW_NOT_AVAILABLE } from './lib/preview/previewGate';

/**
 * Blocks /preview in production. Query parameters cannot enable preview.
 */
export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/preview')) {
    return NextResponse.next();
  }
  // Explicitly ignore any enable/preview query flags.
  void request.nextUrl.searchParams.get('preview');
  void request.nextUrl.searchParams.get('enablePreview');
  if (!isLocalPreviewAllowed(process.env)) {
    return new NextResponse(PREVIEW_NOT_AVAILABLE, {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-EHAS2-Preview': PREVIEW_NOT_AVAILABLE,
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/preview', '/preview/:path*'],
};

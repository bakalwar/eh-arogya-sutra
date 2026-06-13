import { verifyAccessToken } from '@/lib/auth/tokens';

export interface ApiUser {
  id: string;
  role: string;
}

export function requireApiAuth(request: Request): ApiUser | Response {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return Response.json({ success: false, message: 'Authentication required.' }, { status: 401 });
  }
  try {
    const payload = verifyAccessToken(token);
    if (payload.type && payload.type !== 'access') {
      return Response.json({ success: false, message: 'Invalid token type.' }, { status: 401 });
    }
    if (!payload.id) {
      return Response.json({ success: false, message: 'Invalid token.' }, { status: 401 });
    }
    return { id: String(payload.id), role: String(payload.role || 'doctor') };
  } catch {
    return Response.json(
      { success: false, message: 'Session expired. Please sign in again.' },
      { status: 401 }
    );
  }
}

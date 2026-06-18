import { apiRequest } from '@/lib/api/client';
import { getRefreshToken, saveTokens, type SessionUser } from '@/lib/session/tokenManager';

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: SessionUser;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  mustChangePassword?: boolean;
}

export function parseLoginResponse(data: LoginResponse) {
  if (!data?.success) {
    return { ok: false as const, error: data?.message || 'Login failed' };
  }
  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken;
  const user = data.user;
  if (user && (accessToken || refreshToken)) {
    return { ok: true as const, accessToken, refreshToken, user };
  }
  return { ok: false as const, error: data.message || 'Login failed — tokens missing.' };
}

export function homePathForUser(user: SessionUser) {
  if (user?.mustChangePassword) return '/login';
  return '/overview';
}

export async function loginDoctor(mobile: string, password: string) {
  try {
    const data = await apiRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: { mobile, password },
    });
    const parsed = parseLoginResponse(data);
    if (parsed.ok) {
      saveTokens(parsed.accessToken || undefined, parsed.refreshToken, parsed.user);
    }
    return parsed;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Login failed';
    return { ok: false as const, error: msg };
  }
}

export async function signupDoctor(
  mobile: string,
  fullName: string,
  password: string,
  confirmPassword: string,
  clinicName: string,
  termsAccepted: boolean
) {
  try {
    const data = await apiRequest<LoginResponse>('/api/auth/signup', {
      method: 'POST',
      auth: false,
      body: {
        mobile,
        full_name: fullName,
        name: fullName,
        password,
        confirmPassword,
        clinic_name: clinicName,
        terms_accepted: termsAccepted,
      },
    });
    const parsed = parseLoginResponse(data);
    if (parsed.ok) {
      saveTokens(parsed.accessToken || undefined, parsed.refreshToken, parsed.user);
    }
    return parsed;
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Signup failed';
    return { ok: false as const, error: msg };
  }
}

export async function logoutDoctor() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      });
    }
  } catch {
    /* ignore */
  }
}

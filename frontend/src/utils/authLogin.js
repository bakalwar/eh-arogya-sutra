/** Parse POST /api/auth/login response — mobile + password only (no OTP). */
export function parseLoginResponse(data) {
  if (!data || data.success !== true) {
    return { ok: false, error: data?.message || 'Login failed' };
  }

  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken;
  const user = data.user;

  if (user && (accessToken || refreshToken)) {
    return { ok: true, accessToken, refreshToken, user };
  }

  if (data.requiresOtp || data.requireOtp || data.requires2fa) {
    return {
      ok: false,
      error: 'Purana app cache — Ctrl+Shift+R dabayein, phir dubara login karein.'
    };
  }

  return { ok: false, error: data.message || 'Login failed — tokens missing.' };
}

export function homePathForUser(user) {
  if (user?.mustChangePassword) return '/change-password';
  if (user?.role === 'super_admin') return '/super-admin/overview';
  if (user?.role === 'admin') return '/admin';
  return '/dashboard';
}

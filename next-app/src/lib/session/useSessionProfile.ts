'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, type SessionUser } from '@/lib/session/tokenManager';

/** SSR-safe profile — avoids hydration mismatch from localStorage on first paint */
export function useSessionProfile() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setMounted(true);
  }, []);

  const name = mounted ? user?.name?.trim() || 'Doctor' : 'Doctor';
  const initials =
    mounted && user?.name?.trim()
      ? user
          .name!.trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() || '')
          .join('') || 'DR'
      : 'DR';

  return { user: mounted ? user : null, name, initials, mounted };
}

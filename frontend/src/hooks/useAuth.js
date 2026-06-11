import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getValidToken } from '../security/tokenManager';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/** Keeps session alive on protected pages — silent refresh before access token expires. */
export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return undefined;
    }

    getValidToken().then((token) => {
      if (!token) navigate('/login', { replace: true });
    });

    const interval = setInterval(async () => {
      const token = await getValidToken();
      if (!token) navigate('/login', { replace: true });
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [navigate, location.pathname]);
}

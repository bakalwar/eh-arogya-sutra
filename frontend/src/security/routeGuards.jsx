import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, isSuperAdmin, isAdminRole, getCurrentUser } from './tokenManager';

export function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function defaultHomeForUser() {
  const user = getCurrentUser();
  if (user?.role === 'super_admin') return '/super-admin/overview';
  if (user?.role === 'admin') return '/admin';
  return '/dashboard';
}

export function PublicRoute({ children }) {
  if (isSuperAdmin()) return <Navigate to="/super-admin/overview" replace />;
  if (isAuthenticated()) return <Navigate to={defaultHomeForUser()} replace />;
  return children;
}

export function SuperAdminRoute({ children }) {
  if (!isSuperAdmin()) return <Navigate to="/super-admin/login" replace />;
  return children;
}

export function SuperAdminPublicRoute({ children }) {
  if (isSuperAdmin()) return <Navigate to="/super-admin/overview" replace />;
  return children;
}

/** /super-admin → overview if logged in, else login */
export function SuperAdminEntryRedirect() {
  if (isSuperAdmin()) return <Navigate to="/super-admin/overview" replace />;
  return <Navigate to="/super-admin/login" replace />;
}

/** Admin panel login — separate from doctor login */
export function AdminPublicRoute({ children }) {
  if (isAdminRole()) return <Navigate to="/admin" replace />;
  return children;
}

/** /admin/* — admin or super_admin only */
export function AdminOnlyRoute() {
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />;
  if (!isAdminRole()) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

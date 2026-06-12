import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES } from './routes';

/**
 * Global navigation scope guard for admin profiles.
 *
 * Admin profiles (email pattern adm.[a-z]+@ethoshub.dev, resolved server-side)
 * operate exclusively inside the admin panel: any navigation outside /admin/*
 * — professional/recruiter dashboards, public pages, auth pages — is
 * redirected back to the admin dashboard. Non-admin access to /admin/* is
 * enforced separately by ProtectedRoute's allowedRoles.
 */
export function RoleScopeGuard() {
  const { isAuthenticated, isAuthResolved, profile } = useAuthStore();
  const { pathname } = useLocation();

  const isAdmin = isAuthResolved && isAuthenticated && profile?.role === 'admin';
  if (isAdmin && !pathname.startsWith('/admin')) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }

  return <Outlet />;
}

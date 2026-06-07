import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import type { ProfileRole } from '@/shared/types';
import type { ReactNode } from 'react';

const EXPIRES_AT_KEY = 'ethoshub_access_expires_at';
const ACCESS_TOKEN_KEY = 'ethoshub_access_token';

function isTokenExpired(): boolean {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return true;

  const expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY);
  if (!expiresAt) return false;

  return Date.now() > Number(expiresAt) * 1000;
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ProfileRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isAuthResolved, profile, logout } = useAuthStore();
  const expired = isAuthenticated && isTokenExpired();

  // Anti-BFCache: if the browser restores a page from cache after logout,
  // pageshow.persisted=true but the store already has isAuthenticated=false.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && !useAuthStore.getState().isAuthenticated) {
        window.location.replace('/login');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // Expired token: async logout in effect — never call setState during render.
  useEffect(() => {
    if (expired) void logout();
  }, [expired, logout]);

  // Axios interceptors dispatch this event on 401/403 instead of window.location.replace.
  // Avoids a full page reload and lets React Router handle the redirect cleanly.
  useEffect(() => {
    const handleUnauthorized = () => { void logout(); };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  // Hold the render until AuthProvider has completed its async token check.
  // Without this gate, Zustand's default state (isAuthenticated=false) causes
  // a redirect to /login before the persisted session is validated.
  if (!isAuthResolved) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || expired) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

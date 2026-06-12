import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import type { ProfileRole } from '@/shared/types';
import type { ReactNode } from 'react';
import { ACCESS_TOKEN_KEY, EXPIRES_AT_KEY } from '@/shared/lib/sessionKeys';

/**
 * Route guard component that redirects unauthenticated users to login and enforces role-based access.
 */

function isTokenExpired(): boolean {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return true;

  // Verificación por exp claim del JWT
  try {
    const payload = token.split('.')[1];
    if (payload) {
      const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof exp === 'number' && Math.floor(Date.now() / 1000) > exp) return true;
    }
  } catch { /* token malformado → tratar como válido y validar por timestamp */ }

  // Verificación secundaria por timestamp almacenado
  const expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY) ?? localStorage.getItem(EXPIRES_AT_KEY);
  if (expiresAt) return Date.now() > Number(expiresAt) * 1000;

  return false;
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

  
  
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && !useAuthStore.getState().isAuthenticated) {
        window.location.replace('/login');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  
  useEffect(() => {
    if (expired) void logout();
  }, [expired, logout]);

  
  
  useEffect(() => {
    const handleUnauthorized = () => { void logout(); };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  
  
  
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

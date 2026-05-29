import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import type { ProfileRole } from '@/shared/types';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ProfileRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, profile } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

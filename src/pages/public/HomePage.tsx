import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import PublicLandingPage from './PublicLandingPage';

/**
 * Smart HomePage Router
 * - Unauthenticated profiles see the public marketing landing page
 * - Authenticated profiles are redirected to their dashboard
 */
export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PublicLandingPage />;
}

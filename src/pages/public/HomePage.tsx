import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import PublicLandingPage from './PublicLandingPage';

/**
 * Public home page root: renders PublicLandingPage or redirects authenticated users to their dashboard.
 */
export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PublicLandingPage />;
}

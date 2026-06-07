import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // Validate the token in localStorage and mark auth as resolved.
    // The Supabase client auth is driven by the Spring JWT stored in localStorage
    // via setSupabaseAuth() — no Supabase auth state listener needed here.
    void checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

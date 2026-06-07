import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * React context provider that initialises the Supabase auth listener and syncs session changes into authStore.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    
    
    
    void checkAuth();
  }, []); 

  return <>{children}</>;
}

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * React context provider that initialises the Supabase auth listener and syncs session changes into authStore.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    void checkAuth();
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel('ethoshub_auth');
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'logout:global') {
        void logout();
      }
    };
    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [logout]);

  return <>{children}</>;
}

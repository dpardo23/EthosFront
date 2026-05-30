import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const ACCESS_TOKEN_KEY = 'ethoshub_access_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // Validate the token in localStorage and mark auth as resolved.
    // This MUST complete before ProtectedRoute makes any redirect decision.
    void checkAuth();

    if (!isSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const store = useAuthStore.getState();

      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        // Keep the stored token in sync with Supabase's refreshed one.
        // expiresAt is already tracked via expires_in from the session.
        localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
        if (session.expires_at) {
          localStorage.setItem('ethoshub_access_expires_at', String(session.expires_at));
        }
      }

      // SIGNED_OUT fires when: signOut() is called explicitly, token refresh fails,
      // or the session is revoked server-side. Only act if we currently believe
      // the user is authenticated (avoids spurious logouts for credentials sessions
      // that have no Supabase session to begin with).
      if (event === 'SIGNED_OUT' && store.isAuthenticated) {
        void store.logout();
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

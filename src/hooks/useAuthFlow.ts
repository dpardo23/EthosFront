import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ROLE_INITIAL_PATHS } from '@/app/router/routes';
import type { ProfileRole } from '@/shared/types';

/**
 * Custom hook encapsulating the multi-step registration and login flows, including OAuth callback handling and post-auth routing by role.
 */
const PENDING_OAUTH_ROLE_KEY  = 'ethoshub_pending_oauth_role';
const OAUTH_STATE_KEY         = 'ethoshub_oauth_state';

function generateOAuthState(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function storeOAuthState(): string {
  const state = generateOAuthState();
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  return state;
}

export function validateOAuthState(returnedState: string | null): boolean {
  const stored = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  if (!stored || !returnedState) return false;
  return stored === returnedState;
}

export interface LoginResult {
  profile: { role: ProfileRole; email: string; [key: string]: unknown };
  token: string;
  roleDisplayName: string;
  redirectPath: string;
}

export function useAuthFlow() {
  const navigate = useNavigate();
  const login    = useAuthStore((state) => state.login);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  
  const loginWithPassword = async (
    email: string,
    password: string,
  ): Promise<LoginResult | null> => {
    const result = await login(email, password);
    if (result) {
      const destination =
        ROLE_INITIAL_PATHS[result.profile.role as ProfileRole] ??
        ROLE_INITIAL_PATHS.professional;
      navigate(destination, { replace: true });
    }
    return result as LoginResult | null;
  };

  
  const loginWithOAuth = async (
    provider: 'google' | 'github',
    pendingRole?: ProfileRole,
  ): Promise<void> => {
    if (oauthLoading) return; 

    setOauthLoading(provider);
    try {
      if (pendingRole) {
        localStorage.setItem(PENDING_OAUTH_ROLE_KEY, pendingRole);
      }

      if (!isSupabaseConfigured || !supabase) {
        toast.error('OAuth no configurado', {
          description: 'Las credenciales de Supabase no están disponibles.',
        });
        setOauthLoading(null);
        return;
      }

      const csrfState = storeOAuthState();

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/oauth-success`,
          queryParams: { state: csrfState },
          scopes: provider === 'google' ? 'email profile' : 'read:user user:email',
        },
      });

      if (error) {
        toast.error('Error al iniciar sesión', { description: error.message });
        setOauthLoading(null);
      }
      
      
    } catch {
      toast.error('Error al conectar con el proveedor de autenticación');
      setOauthLoading(null);
    }
  };

  return { loginWithPassword, loginWithOAuth, oauthLoading };
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl      = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured =
  typeof supabaseUrl === 'string'     && supabaseUrl.length > 0 &&
  typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken:  false,
        persistSession:    false,
        detectSessionInUrl: false,
      },
      global: {
        // Inyectar dinámicamente el JWT de Supabase (guardado por el backend Spring)
        // en cada request para que PostgREST lo evalúe como rol `authenticated`.
        fetch: (url, options = {}) => {
          const token = sessionStorage.getItem('ethoshub_access_token');
          const headers = new Headers((options as RequestInit).headers);
          if (token && !token.startsWith('mock-')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return fetch(url, { ...(options as RequestInit), headers });
        },
      },
    })
  : null;

/**
 * Autentica el Realtime con el JWT actual para que los canales
 * postgres_changes funcionen como rol `authenticated`.
 * Llamar tras login y al restaurar sesión en checkAuth.
 */
export function setSupabaseAuth(accessToken: string | null): void {
  if (!supabase) return;
  if (accessToken && !accessToken.startsWith('mock-')) {
    supabase.realtime.setAuth(accessToken);
  }
}

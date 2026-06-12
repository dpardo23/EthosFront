import { createClient } from '@supabase/supabase-js';
import { ACCESS_TOKEN_KEY } from '@/shared/lib/sessionKeys';

/**
 * Initialises and exports the Supabase browser client used for auth session management and Realtime subscriptions.
 */
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
        fetch: (url, options = {}) => {
          const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
          const headers = new Headers((options as RequestInit).headers);
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return fetch(url, { ...(options as RequestInit), headers });
        },
      },
    })
  : null;

export function setSupabaseAuth(accessToken: string | null): void {
  if (!supabase) return;
  if (accessToken) {
    supabase.realtime.setAuth(accessToken);
  }
}

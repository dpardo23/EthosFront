import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, ProfileRole } from '@/shared/types';
import { authService, ROLE_DISPLAY_NAMES, ROLE_REDIRECT_PATHS, type ProfileUpdatePayload } from '@/shared/services/authService';
import { setSupabaseAuth, supabase } from '@/lib/supabase';
import { resetAllStores } from './resetAllStores';
import { ACCESS_TOKEN_KEY, TOKEN_TYPE_KEY, EXPIRES_AT_KEY } from '@/shared/lib/sessionKeys';

/**
 * Zustand store for authentication state: holds the current user session, profile id, role, and exposes login/logout actions used across the app.
 */

interface LoginResult {
  profile: Profile;
  roleDisplayName: string;
  redirectPath: string;
}

interface AuthStore {
  profile: Profile | null;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, role?: ProfileRole) => Promise<LoginResult | null>;
  updateProfile: (data: ProfileUpdatePayload) => Promise<void>;
  updateRecruiterIdentity: (data: { firstName: string; lastName: string; country?: string; phone?: string; photoUrl?: string }) => Promise<void>;
  syncProfile: (data: Partial<Profile>) => void;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  completeOAuthLogin: (args: {
    profile: Profile;
    token: string;
    tokenType?: string;
    expiresIn?: number;
  }) => void;
  switchRole: (role: ProfileRole) => void;
  getRoleDisplayName: () => string;
  getRedirectPath: () => string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isAuthenticated: false,
      isAuthResolved: false,
      loading: false,
      error: null,

      login: async (email: string, password: string, role?: ProfileRole): Promise<LoginResult | null> => {
        set({ loading: true, error: null });

        try {
          const result = await authService.login(email, password, role);

          const rawRole = (result.profile?.role || '').toLowerCase();
          const normalizedRole: ProfileRole = rawRole.includes('admin') ? 'admin'
                                         : rawRole.includes('rec') || rawRole.includes('reclutador') ? 'recruiter'
                                         : 'professional';

          const profile = { ...result.profile, role: normalizedRole };

          const expiresAtVal = typeof result.expiresIn === 'number' && Number.isFinite(result.expiresIn)
            ? String(Math.floor(Date.now() / 1000) + result.expiresIn)
            : null;

          sessionStorage.setItem(ACCESS_TOKEN_KEY, result.token);
          sessionStorage.setItem(TOKEN_TYPE_KEY, result.tokenType || 'Bearer');
          if (expiresAtVal) sessionStorage.setItem(EXPIRES_AT_KEY, expiresAtVal);
          else sessionStorage.removeItem(EXPIRES_AT_KEY);

          setSupabaseAuth(result.token);

          set({ profile, isAuthenticated: true, isAuthResolved: true, loading: false });

          return {
            profile,
            roleDisplayName: ROLE_DISPLAY_NAMES[normalizedRole] || 'Usuario',
            redirectPath: ROLE_REDIRECT_PATHS[normalizedRole] || '/dashboard',
          };
        } catch (error) {
          console.error("🔥 Error real de Login:", error);
          set({
            error: error instanceof Error ? error.message : 'Error al iniciar sesión',
            loading: false,
          });

          throw error;
        }
      },

      fetchProfile: async () => {
        const { profile } = get();
        if (!profile) return;
        if (!profile.profile_id) {
          console.error('El usuario no tiene profile_id');
          return;
        }
        try {
          const dbData = await authService.getProfile(profile.profile_id, profile.role);
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...dbData } : null,
          }));
        } catch (error: any) {
          
          
          
          console.error('Error al sincronizar perfil con la BD', error);
        }
      },

      updateProfile: async (data: ProfileUpdatePayload) => {
        const { profile } = get();
        if (!profile) return;
        
        if (!profile.profile_id) {
          console.error('El usuario no tiene un profile_id asociado');
          set({ error: 'No se encontró el ID de perfil', loading: false });
          return;
        }
        
        set({ loading: true, error: null });
        try {
          const updatedProfile = await authService.updateProfile(profile.profile_id, data);
          
          set({ 
            profile: { 
              ...profile, 
              ...(updatedProfile || {}), 
              ...data,
              name: data.firstName || data.lastName ? `${data.firstName || profile.name.split(' ')[0]} ${data.lastName || profile.name.split(' ').slice(1).join(' ')}`.trim() : profile.name,
              avatar: data.photoUrl || data.avatar || profile.avatar,
              location: data.country || data.location || profile.location,
              phone: data.phone || profile.phone,
            }, 
            loading: false 
          });
        } catch {
          set({ error: 'Error al actualizar perfil', loading: false });
        }
      },

      updateRecruiterIdentity: async (data) => {
        const { profile } = get();
        if (!profile) return;
        
        if (!profile.profile_id) {
          console.error('El usuario no tiene un profile_id asociado');
          set({ error: 'No se encontró el ID de perfil', loading: false });
          return;
        }
        
        set({ loading: true, error: null });
        try {
          await authService.updateRecruiterIdentity(profile.profile_id, {
            firstName:   data.firstName,
            lastName:    data.lastName,
            countryCode: data.country,
            phoneNumber: data.phone,
            photoUrl:    data.photoUrl,
          });
          
          set({ 
            profile: { 
              ...profile,
              name: `${data.firstName} ${data.lastName}`.trim(),
              avatar: data.photoUrl || profile.avatar,
              location: data.country || profile.location,
              phone: data.phone || profile.phone,
            }, 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error al actualizar identidad', 
            loading: false 
          });
        }
      },

      syncProfile: (data: Partial<Profile>) => {
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...data } : state.profile,
        }));
      },

      logout: async () => {
        set({ loading: true });
        try {
          await authService.logout();
        } finally {
          // 1. Limpiar tokens de sessionStorage (solo esta tab)
          sessionStorage.removeItem(ACCESS_TOKEN_KEY);
          sessionStorage.removeItem(TOKEN_TYPE_KEY);
          sessionStorage.removeItem(EXPIRES_AT_KEY);
          // 2. Limpiar toda la clave persist del auth store
          try { localStorage.removeItem('ethoshub_auth'); } catch { /* ignore */ }
          // 3. Cerrar sesión en Supabase Realtime
          supabase?.auth.signOut({ scope: 'local' });
          // 4. Resetear todos los stores de datos de usuario
          resetAllStores();
          // 5. Resetear el estado propio al final
          set({ profile: null, isAuthenticated: false, isAuthResolved: true, loading: false, error: null });
        }
      },

      checkAuth: async () => {
        const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
        const expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY);

        function jwtExpired(t: string): boolean {
          try {
            const payload = t.split('.')[1];
            const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
            return typeof exp === 'number' && Math.floor(Date.now() / 1000) > exp;
          } catch { return false; }
        }

        const expiredByStore = !!expiresAt && Date.now() > Number(expiresAt) * 1000;
        const expiredByJwt   = token ? jwtExpired(token) : false;

        if (!token || expiredByStore || expiredByJwt) {
          sessionStorage.removeItem(ACCESS_TOKEN_KEY);
          sessionStorage.removeItem(TOKEN_TYPE_KEY);
          sessionStorage.removeItem(EXPIRES_AT_KEY);
          set({ profile: null, isAuthenticated: false, isAuthResolved: true });
          return;
        }

        setSupabaseAuth(token);

        const { profile } = get();
        set({ isAuthenticated: !!profile, isAuthResolved: true });
      },

      completeOAuthLogin: ({ profile, token, tokenType = 'Bearer', expiresIn }) => {
        const ttl = typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : 3600;
        const expiresAtVal = String(Math.floor(Date.now() / 1000) + ttl);

        sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
        sessionStorage.setItem(TOKEN_TYPE_KEY, tokenType);
        sessionStorage.setItem(EXPIRES_AT_KEY, expiresAtVal);

        const rawRole = (profile.role || '').toLowerCase();
        const normalizedRole: ProfileRole =
          rawRole.includes('admin')                              ? 'admin'
          : rawRole.includes('rec') || rawRole === 'recruiter'  ? 'recruiter'
          : 'professional';

        setSupabaseAuth(token);

        set({ profile: { ...profile, role: normalizedRole }, isAuthenticated: true, isAuthResolved: true, error: null, loading: false });
      },

      switchRole: (role: ProfileRole) => {
        const { profile } = get();
        if (profile) set({ profile: { ...profile, role } });
      },

      getRoleDisplayName: () => {
        const { profile } = get();
        if (!profile) return 'Invitado';
        return ROLE_DISPLAY_NAMES[profile.role] || 'Usuario';
      },

      getRedirectPath: () => {
        const { profile } = get();
        if (!profile) return '/';
        return ROLE_REDIRECT_PATHS[profile.role] || '/dashboard';
      },
    }),
    {
      name: 'ethoshub_auth',
      
      
      partialize: ({ profile, isAuthenticated }) => ({ profile, isAuthenticated }),
    }
  )
);
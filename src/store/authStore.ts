import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, ProfileRole } from '@/shared/types';
import { authService, ROLE_DISPLAY_NAMES, ROLE_REDIRECT_PATHS, type ProfileUpdatePayload } from '@/shared/services/authService';
import { findMockProfile } from '@/features/auth';

const ACCESS_TOKEN_KEY = 'ethoshub_access_token';
const TOKEN_TYPE_KEY = 'ethoshub_token_type';
const EXPIRES_AT_KEY = 'ethoshub_access_expires_at';

interface LoginResult {
  profile: Profile;
  roleDisplayName: string;
  redirectPath: string;
}

interface AuthStore {
  profile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, role?: ProfileRole) => Promise<LoginResult | null>;
  updateProfile: (data: ProfileUpdatePayload) => Promise<void>;
  updateRecruiterIdentity: (data: { firstName: string; lastName: string; country?: string; countryId?: number; phone?: string; photoUrl?: string }) => Promise<void>;
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
      loading: false,
      error: null,

      login: async (email: string, password: string, role?: ProfileRole): Promise<LoginResult | null> => {
        set({ loading: true, error: null });

        const mockProfile = findMockProfile(email);
        if (mockProfile) {
          const token = `mock-token-${mockProfile.role}-${Date.now()}`;
          localStorage.setItem(ACCESS_TOKEN_KEY, token);
          localStorage.setItem(TOKEN_TYPE_KEY, 'Bearer');
          set({ profile: mockProfile, isAuthenticated: true, loading: false, error: null });
          return {
            profile: mockProfile,
            roleDisplayName: ROLE_DISPLAY_NAMES[mockProfile.role] ?? 'Usuario',
            redirectPath: ROLE_REDIRECT_PATHS[mockProfile.role] ?? '/dashboard',
          };
        }

        try {
          const result = await authService.login(email, password, role);
          
          const rawRole = (result.profile?.role || '').toLowerCase();
          const normalizedRole: ProfileRole = rawRole.includes('admin') ? 'admin' 
                                         : rawRole.includes('rec') || rawRole.includes('reclutador') ? 'recruiter' 
                                         : 'professional';
          
          const profile = { ...result.profile, role: normalizedRole };

          localStorage.setItem(ACCESS_TOKEN_KEY, result.token);
          localStorage.setItem(TOKEN_TYPE_KEY, result.tokenType || 'Bearer');
          
          if (typeof result.expiresIn === 'number' && Number.isFinite(result.expiresIn)) {
            localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + result.expiresIn));
          } else {
            localStorage.removeItem(EXPIRES_AT_KEY);
          }

          set({ profile, isAuthenticated: true, loading: false });

          await get().fetchProfile();

          return {
            profile: get().profile || profile,
            roleDisplayName: ROLE_DISPLAY_NAMES[normalizedRole] || 'Usuario',
            redirectPath: ROLE_REDIRECT_PATHS[normalizedRole] || '/dashboard',
          };
        } catch (error) {
          console.error("🔥 Error real de Login:", error);
          set({
            error: error instanceof Error ? error.message : 'Error al iniciar sesión',
            loading: false,
          });
          // 🚀 LANZAMOS EL ERROR PARA QUE EL COMPONENTE LO ATRAPE
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
          const dbData = await authService.getProfile(profile.profile_id);
          set((state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  ...dbData,
                }
              : null,
          }));
        } catch (error) {
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
            firstName: data.firstName,
            lastName: data.lastName,
            countryId: data.countryId,
            phoneNumber: data.phone,
            photoUrl: data.photoUrl,
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
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(TOKEN_TYPE_KEY);
          localStorage.removeItem(EXPIRES_AT_KEY);
          set({ profile: null, isAuthenticated: false, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      checkAuth: async () => {
        const { profile } = get();
        if (profile) {
          set({ isAuthenticated: true });
          await get().fetchProfile();
        }
      },

      completeOAuthLogin: ({ profile, token, tokenType = 'Bearer', expiresIn }) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        localStorage.setItem(TOKEN_TYPE_KEY, tokenType);
        if (expiresIn) localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresIn));
        
        const rawRole = (profile.role || '').toLowerCase();
        const normalizedRole: ProfileRole = rawRole.includes('admin') ? 'admin' : (rawRole as ProfileRole);
        
        set({ profile: { ...profile, role: normalizedRole }, isAuthenticated: true, error: null, loading: false });
        get().fetchProfile();
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
    { name: 'ethoshub_auth' }
  )
);
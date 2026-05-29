import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/shared/types';
import { authService, ROLE_DISPLAY_NAMES, ROLE_REDIRECT_PATHS, type ProfileUpdatePayload } from '@/shared/services/authService';
import { findMockUser } from '@/features/auth';

const ACCESS_TOKEN_KEY = 'ethoshub_access_token';
const TOKEN_TYPE_KEY = 'ethoshub_token_type';
const EXPIRES_AT_KEY = 'ethoshub_access_expires_at';

interface LoginResult {
  user: User;
  roleDisplayName: string;
  redirectPath: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, role?: UserRole) => Promise<LoginResult | null>;
  updateProfile: (data: ProfileUpdatePayload) => Promise<void>;
  updateRecruiterIdentity: (data: { firstName: string; lastName: string; country?: string; countryId?: number; phone?: string; photoUrl?: string }) => Promise<void>;
  syncUser: (data: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  completeOAuthLogin: (args: {
    user: User;
    token: string;
    tokenType?: string;
    expiresIn?: number;
  }) => void;
  switchRole: (role: UserRole) => void;
  getRoleDisplayName: () => string;
  getRedirectPath: () => string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email: string, password: string, role?: UserRole): Promise<LoginResult | null> => {
        set({ loading: true, error: null });

        const mockUser = findMockUser(email);
        if (mockUser) {
          const token = `mock-token-${mockUser.role}-${Date.now()}`;
          localStorage.setItem(ACCESS_TOKEN_KEY, token);
          localStorage.setItem(TOKEN_TYPE_KEY, 'Bearer');
          set({ user: mockUser, isAuthenticated: true, loading: false, error: null });
          return {
            user: mockUser,
            roleDisplayName: ROLE_DISPLAY_NAMES[mockUser.role] ?? 'Usuario',
            redirectPath: ROLE_REDIRECT_PATHS[mockUser.role] ?? '/dashboard',
          };
        }

        try {
          const result = await authService.login(email, password, role);
          
          const rawRole = (result.user?.role || '').toLowerCase();
          const normalizedRole: UserRole = rawRole.includes('admin') ? 'admin' 
                                         : rawRole.includes('rec') || rawRole.includes('reclutador') ? 'recruiter' 
                                         : 'professional';
          
          const user = { ...result.user, role: normalizedRole };

          localStorage.setItem(ACCESS_TOKEN_KEY, result.token);
          localStorage.setItem(TOKEN_TYPE_KEY, result.tokenType || 'Bearer');
          
          if (typeof result.expiresIn === 'number' && Number.isFinite(result.expiresIn)) {
            localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + result.expiresIn));
          } else {
            localStorage.removeItem(EXPIRES_AT_KEY);
          }

          set({ user, isAuthenticated: true, loading: false });

          await get().fetchProfile();

          return {
            user: get().user || user,
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
        const { user } = get();
        if (!user) return;
        if (!user.profile_id) {
          console.error('El usuario no tiene profile_id');
          return;
        }
        try {
          const dbData = await authService.getProfile(user.profile_id);
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  ...dbData,
                }
              : null,
          }));
        } catch (error) {
          console.error('Error al sincronizar perfil con la BD', error);
        }
      },

      updateProfile: async (data: ProfileUpdatePayload) => {
        const { user } = get();
        if (!user) return;
        
        if (!user.profile_id) {
          console.error('El usuario no tiene un profile_id asociado');
          set({ error: 'No se encontró el ID de perfil', loading: false });
          return;
        }
        
        set({ loading: true, error: null });
        try {
          const updatedUser = await authService.updateProfile(user.profile_id, data);
          
          set({ 
            user: { 
              ...user, 
              ...(updatedUser || {}), 
              ...data,
              name: data.firstName || data.lastName ? `${data.firstName || user.name.split(' ')[0]} ${data.lastName || user.name.split(' ').slice(1).join(' ')}`.trim() : user.name,
              avatar: data.photoUrl || data.avatar || user.avatar,
              location: data.country || data.location || user.location,
              phone: data.phone || user.phone,
            }, 
            loading: false 
          });
        } catch {
          set({ error: 'Error al actualizar perfil', loading: false });
        }
      },

      updateRecruiterIdentity: async (data) => {
        const { user } = get();
        if (!user) return;
        
        if (!user.profile_id) {
          console.error('El usuario no tiene un profile_id asociado');
          set({ error: 'No se encontró el ID de perfil', loading: false });
          return;
        }
        
        set({ loading: true, error: null });
        try {
          await authService.updateRecruiterIdentity(user.profile_id, {
            firstName: data.firstName,
            lastName: data.lastName,
            countryId: data.countryId,
            phoneNumber: data.phone,
            photoUrl: data.photoUrl,
          });
          
          set({ 
            user: { 
              ...user,
              name: `${data.firstName} ${data.lastName}`.trim(),
              avatar: data.photoUrl || user.avatar,
              location: data.country || user.location,
              phone: data.phone || user.phone,
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

      syncUser: (data: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : state.user,
        }));
      },

      logout: async () => {
        set({ loading: true });
        try {
          await authService.logout();
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(TOKEN_TYPE_KEY);
          localStorage.removeItem(EXPIRES_AT_KEY);
          set({ user: null, isAuthenticated: false, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      checkAuth: async () => {
        const { user } = get();
        if (user) {
          set({ isAuthenticated: true });
          await get().fetchProfile();
        }
      },

      completeOAuthLogin: ({ user, token, tokenType = 'Bearer', expiresIn }) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        localStorage.setItem(TOKEN_TYPE_KEY, tokenType);
        if (expiresIn) localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresIn));
        
        const rawRole = (user.role || '').toLowerCase();
        const normalizedRole: UserRole = rawRole.includes('admin') ? 'admin' : (rawRole as UserRole);
        
        set({ user: { ...user, role: normalizedRole }, isAuthenticated: true, error: null, loading: false });
        get().fetchProfile();
      },

      switchRole: (role: UserRole) => {
        const { user } = get();
        if (user) set({ user: { ...user, role } });
      },

      getRoleDisplayName: () => {
        const { user } = get();
        if (!user) return 'Invitado';
        return ROLE_DISPLAY_NAMES[user.role] || 'Usuario';
      },

      getRedirectPath: () => {
        const { user } = get();
        if (!user) return '/';
        return ROLE_REDIRECT_PATHS[user.role] || '/dashboard';
      },
    }),
    { name: 'ethoshub_auth' }
  )
);
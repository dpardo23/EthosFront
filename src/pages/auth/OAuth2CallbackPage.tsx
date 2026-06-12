import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store';
import type { Profile, ProfileRole } from '@/shared/types';
import { ROLE_INITIAL_PATHS } from '@/app/router/routes';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { validateOAuthState } from '@/hooks/useAuthFlow';
import api from '@/shared/api/api';

/**
 * Handles the Supabase OAuth redirect: exchanges the code, calls oauth/sync, and routes by role.
 */
const PENDING_OAUTH_ROLE_KEY = 'ethoshub_pending_oauth_role';

type JwtPayload = {
  profileId?: string;
  email?: string;
  profileHandle?: string;
  profileType?: string;
  exp?: number;
};

type BackendSyncData = {
  profileId: string;
  email: string;
  role: string;
};

type BackendApiResponse<T> = {
  success: boolean;
  status: number;
  message: string;
  data: T;
};

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const withPadding = padding ? normalized + '='.repeat(4 - padding) : normalized;
  return atob(withPadding);
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

function mapRoleStringToProfileRole(roleStr?: string): ProfileRole {
  const upper = (roleStr || '').toUpperCase();
  if (upper === 'RECRUITER' || upper === 'RECLUTADOR') return 'recruiter';
  if (upper === 'ADMIN'     || upper === 'ADMINISTRADOR') return 'admin';
  return 'professional';
}

function sanitizeSlug(value: string): string {
  const base = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return base || `perfil-${Date.now()}`;
}

function buildProfileFromToken(payload: JwtPayload): Profile {
  if (!payload.profileId) throw new Error('El token no contiene un identificador válido.');
  const email       = payload.email || '';
  const displayName = payload.profileHandle || (email.includes('@') ? email.split('@')[0] : 'oauth-profile');
  const role        = mapRoleStringToProfileRole(payload.profileType);
  return {
    id: payload.profileId, profile_id: payload.profileId,
    email, name: displayName,
    profileHandle: displayName.toLowerCase().replace(/\s+/g, ''),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
    role, slug: sanitizeSlug(displayName),
    profession: role === 'recruiter' ? 'Reclutador' : role === 'admin' ? 'Administrador' : 'Profesional',
    bio: '', headline: role === 'recruiter' ? 'Encontrando talento verificado' : 'Construyendo mi perfil profesional',
    location: '', website: '', createdAt: new Date().toISOString(),
  };
}

function buildProfileFromSession(
  user: { id: string; email?: string | null; user_metadata?: Record<string, string> },
  role: ProfileRole,
  profileId: string,
): Profile {
  const email       = user.email || '';
  const fullName    = user.user_metadata?.full_name || user.user_metadata?.name || '';
  const displayName = fullName || (email.includes('@') ? email.split('@')[0] : 'perfil');
  const rawAvatar   = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  // Only accept https:// avatar URLs — reject data: / javascript: / http: payloads
  const avatarUrl   = rawAvatar.startsWith('https://') ? rawAvatar : '';
  return {
    id: profileId, profile_id: profileId,
    email, name: displayName,
    profileHandle: displayName.toLowerCase().replace(/\s+/g, ''),
    avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
    role, slug: sanitizeSlug(displayName),
    profession: role === 'recruiter' ? 'Reclutador' : role === 'admin' ? 'Administrador' : 'Profesional',
    bio: '', headline: role === 'recruiter' ? 'Encontrando talento verificado' : 'Construyendo mi perfil profesional',
    location: '', website: '', createdAt: new Date().toISOString(),
  };
}


export default function OAuth2CallbackPage() {
  const navigate          = useNavigate();
  const [searchParams]    = useSearchParams();
  const completeOAuthLogin = useAuthStore((state) => state.completeOAuthLogin);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      toast.error('No se pudo iniciar sesión', { description: urlError });
      navigate('/login', { replace: true });
      return;
    }

    
    const token = searchParams.get('token');
    if (token) {
      const payload = decodeJwtPayload(token);
      if (!payload) {
        toast.error('Token OAuth inválido');
        navigate('/login', { replace: true });
        return;
      }
      try {
        const profile = buildProfileFromToken(payload);
        completeOAuthLogin({ profile, token, tokenType: 'Bearer' });
        toast.success('Sesión iniciada', { description: `Bienvenido, ${profile.name}` });
        navigate(ROLE_INITIAL_PATHS[profile.role], { replace: true });
      } catch (err) {
        toast.error('Error de autenticación', { description: err instanceof Error ? err.message : 'Token corrupto' });
        useAuthStore.getState().logout();
        navigate('/login', { replace: true });
      }
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      toast.error('Respuesta OAuth incompleta');
      navigate('/login', { replace: true });
      return;
    }

    // CSRF: Supabase embeds the state in the URL fragment and validates it
    // internally before exchangeCodeForSession completes. We verify that the
    // flow was initiated from this browser session by checking our stored state
    // token. The state value itself arrives in the hash, not in searchParams,
    // so we parse it manually from window.location.hash.
    const hashParams     = new URLSearchParams(window.location.hash.replace('#', ''));
    const returnedState  = hashParams.get('state') ?? searchParams.get('state');
    if (!validateOAuthState(returnedState)) {
      toast.error('Solicitud OAuth inválida', {
        description: 'El parámetro de estado no coincide. Intenta iniciar sesión nuevamente.',
      });
      navigate('/login', { replace: true });
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error || !session?.user) {
        toast.error('No se pudo completar el inicio de sesión');
        navigate('/login', { replace: true });
        return;
      }

      const user        = session.user;
      const accessToken = session.access_token;

      
      
      
      const appMetaRole      = (user.app_metadata as Record<string, string> | undefined)?.role;
      const pendingRole      = localStorage.getItem(PENDING_OAUTH_ROLE_KEY);
      const isNewRegistration = pendingRole !== null && !appMetaRole;
      const roleToSync       = appMetaRole || pendingRole || 'professional';
      localStorage.removeItem(PENDING_OAUTH_ROLE_KEY);

      try {
        const response = await api.post<BackendApiResponse<BackendSyncData>>(
          '/auth/oauth/sync',
          { role: roleToSync.toUpperCase(), isNewRegistration },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        const sync      = response.data.data;
        const finalRole = mapRoleStringToProfileRole(sync.role);
        const profile   = buildProfileFromSession(user, finalRole, sync.profileId);

        completeOAuthLogin({ profile, token: accessToken, tokenType: 'Bearer' });
        toast.success('Sesión iniciada', { description: `Bienvenido, ${profile.name}` });
        navigate(ROLE_INITIAL_PATHS[finalRole], { replace: true });
      } catch (error: any) {
        const status: number | undefined = error.response?.status;

        
        if (status !== undefined) {
          await supabase?.auth.signOut();
          toast.error('Error al iniciar sesión', {
            description: error.response?.data?.message ?? 'No se pudo completar el registro. Por favor inténtalo de nuevo.',
          });
          navigate('/register', { replace: true });
          return;
        }

        
        console.warn('Fallback: backend no disponible', error);
        const finalRole = mapRoleStringToProfileRole(roleToSync);
        const profile   = buildProfileFromSession(user, finalRole, user.id);
        completeOAuthLogin({ profile, token: accessToken, tokenType: 'Bearer' });
        navigate(ROLE_INITIAL_PATHS[finalRole], { replace: true });
      }
    });
  }, [completeOAuthLogin, navigate, searchParams]);

  return (
    <div className="flex min-h-[45vh] items-center justify-center px-6 text-center">
      <div className="animate-pulse">
        <h1 className="text-2xl font-bold text-foreground">Procesando inicio de sesión...</h1>
        <p className="mt-2 text-sm text-muted-foreground">Un momento...</p>
      </div>
    </div>
  );
}
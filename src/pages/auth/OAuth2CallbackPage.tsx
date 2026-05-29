import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store';
import type { Profile, ProfileRole } from '@/shared/types';
import { ROLE_REDIRECT_PATHS } from '@/shared/services/authService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type JwtPayload = {
  profileId?: string; 
  email?: string;
  profileHandle?: string;
  profileType?: string; 
  exp?: number;
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
    const raw = base64UrlDecode(parts[1]);
    return JSON.parse(raw) as JwtPayload;
  } catch {
    return null;
  }
}

function mapProfileTypeToRole(profileType?: string): ProfileRole {
  const type = profileType?.toUpperCase();
  if (type === 'RECLUTADOR' || type === 'RECRUITER') return 'recruiter';
  if (type === 'ADMINISTRADOR' || type === 'ADMIN') return 'admin';
  return 'professional';
}

function sanitizeSlug(value: string): string {
  const base = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return base || `usuario-${Date.now()}`;
}

function buildProfileFromToken(payload: JwtPayload): Profile {
  if (!payload.profileId) {
    throw new Error('El token recibido no contiene un identificador válido (UUID).');
  }

  const email = payload.email || '';
  const displayName = payload.profileHandle || (email.includes('@') ? email.split('@')[0] : 'oauth-profile');
  const role = mapProfileTypeToRole(payload.profileType);

  return {
    id: payload.profileId, 
    email,
    name: displayName,
    profileHandle: displayName.toLowerCase().replace(/\s+/g, ''),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
    role,
    slug: sanitizeSlug(displayName),
    profession: role === 'recruiter' ? 'Reclutador' : role === 'admin' ? 'Administrador' : 'Profesional',
    bio: '',
    headline: role === 'recruiter' ? 'Encontrando talento verificado' : 'Construyendo mi perfil profesional',
    location: '',
    website: '',
    createdAt: new Date().toISOString(),
  };
}

function buildProfileFromSupabase(sbProfile: { id: string; email?: string | null; user_metadata?: Record<string, string> }): Profile {
  const email = sbProfile.email || '';
  const fullName = sbProfile.user_metadata?.full_name || sbProfile.user_metadata?.name || '';
  const displayName = fullName || (email.includes('@') ? email.split('@')[0] : 'usuario');
  const avatarUrl = sbProfile.user_metadata?.avatar_url || sbProfile.user_metadata?.picture || '';

  return {
    id: sbProfile.id,
    email,
    name: displayName,
    profileHandle: displayName.toLowerCase().replace(/\s+/g, ''),
    avatar: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
    role: 'professional' as ProfileRole,
    slug: sanitizeSlug(displayName),
    profession: 'Profesional',
    bio: '',
    headline: 'Construyendo mi perfil profesional',
    location: '',
    website: '',
    createdAt: new Date().toISOString(),
  };
}

export default function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      // Flujo backend JWT (Spring Boot)
      const payload = decodeJwtPayload(token);
      if (!payload) {
        toast.error('Token OAuth inválido');
        navigate('/login', { replace: true });
        return;
      }
      try {
        const profile = buildProfileFromToken(payload);
        completeOAuthLogin({ profile, token, tokenType: 'Bearer' });
        toast.success('Sesión iniciada correctamente', { description: `Bienvenido, ${profile.name}` });
        navigate(ROLE_REDIRECT_PATHS[profile.role], { replace: true });
      } catch (err) {
        toast.error('Error de autenticación', { description: err instanceof Error ? err.message : 'Token corrupto' });
        useAuthStore.getState().logout();
        navigate('/login', { replace: true });
      }
      return;
    }

    if (isSupabaseConfigured && supabase) {
      // Flujo Supabase OAuth (PKCE — el SDK intercambia el code automáticamente)
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error || !session?.user) {
          toast.error('No se pudo completar el inicio de sesión con Supabase');
          navigate('/login', { replace: true });
          return;
        }
        const profile = buildProfileFromSupabase(session.user);
        completeOAuthLogin({ profile, token: session.access_token, tokenType: 'Bearer' });
        toast.success('Sesión iniciada correctamente', { description: `Bienvenido, ${profile.name}` });
        navigate(ROLE_REDIRECT_PATHS[profile.role], { replace: true });
      });
      return;
    }

    toast.error('Respuesta OAuth incompleta');
    navigate('/login', { replace: true });
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
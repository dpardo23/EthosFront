import type { Profile, ProfileRole } from '@/shared/types';
import api from '@/shared/api/api';

export type ProfileUpdatePayload = Partial<Profile> & {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  country?: string;
  phone?: string;
  availabilityStatus?: string;
};

type BackendAuthResponse = {
  token: string;
  profileId: string;
  email: string;
  role?: string;
};

type BackendApiResponse<T> = {
  success: boolean;
  status: number;
  message: string;
  data: T;
  errors?: string[];
};

export type LoginApiResult = {
  profile: Profile;
  token: string;
  tokenType: string;
  expiresIn: number;
};

type RegisterRole = 'PROFESSIONAL' | 'RECRUITER';

function mapRoleToBackend(role: ProfileRole): RegisterRole {
  return role === 'recruiter' ? 'RECRUITER' : 'PROFESSIONAL';
}

function sanitizeSlug(value: string): string {
  const base = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return base || `usuario-${Date.now()}`;
}

export const ROLE_DISPLAY_NAMES: Record<ProfileRole, string> = {
  professional: 'Profesional',
  recruiter: 'Reclutador',
  admin: 'Administrador',
  guest: 'Invitado',
};

export const ROLE_REDIRECT_PATHS: Record<ProfileRole, string> = {
  professional: '/dashboard/profesional/configuracion',
  recruiter:    '/dashboard/reclutador/configuracion',
  admin:        '/admin/dashboard',
  guest:        '/',
};

// Extract the remaining TTL (seconds) from the JWT `exp` claim.
// Falls back to 3600 (Supabase default) if the token can't be decoded.
function jwtExpiresIn(token: string): number {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof decoded.exp === 'number') {
      return Math.max(decoded.exp - Math.floor(Date.now() / 1000), 0);
    }
  } catch { /* ignore */ }
  return 3600;
}

async function login(email: string, password: string, role?: ProfileRole): Promise<LoginApiResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const response = await api.post<BackendApiResponse<BackendAuthResponse>>('/auth/login', {
    email: normalizedEmail,
    password
  });

  const authResponse = response.data.data;
  if (!authResponse?.token) {
    throw new Error('La respuesta de login no incluyó token');
  }

  let finalRole: ProfileRole = 'professional';

  if (authResponse.role) {
    const backendRole = authResponse.role.toUpperCase();

    if (backendRole.includes('ADMIN')) {
      finalRole = 'admin';
    } else if (backendRole.includes('RECRUITER') || backendRole.includes('RECLUTADOR')) {
      finalRole = 'recruiter';
    }
  } else if (role) {
    finalRole = role;
  }

  const profile: Profile = {
    id: authResponse.profileId,
    email: authResponse.email,
    name: authResponse.email.split('@')[0],
    profileHandle: authResponse.email.split('@')[0],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authResponse.email)}`,
    role: finalRole,
    profile_id: authResponse.profileId,
    slug: sanitizeSlug(authResponse.email.split('@')[0]),
    profession: finalRole === 'admin' ? 'Administrador' : finalRole === 'recruiter' ? 'Reclutador' : 'Profesional',
    bio: '',
    headline: finalRole === 'admin' ? 'Gestión del sistema' : finalRole === 'recruiter' ? 'Encontrando talento verificado' : 'Construyendo mi perfil profesional',
    location: '',
    createdAt: new Date().toISOString(),
  };

  return {
    profile,
    token: authResponse.token,
    tokenType: 'Bearer',
    expiresIn: jwtExpiresIn(authResponse.token),
  };
}

export type RegisterAuthResult = {
  token: string | null;
  profileId: string;
  email: string;
  role: string;
};

async function registerLocal(
  email: string,
  password: string,
  role: ProfileRole,
  extras?: { firstName?: string; lastName?: string; phoneCode?: string; phoneNumber?: string; countryCode?: string }
): Promise<RegisterAuthResult> {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const response = await api.post<BackendApiResponse<RegisterAuthResult>>('/auth/register', {
      email: normalizedEmail,
      password,
      role: mapRoleToBackend(role),
      ...(extras ?? {}),
    });
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 409) {
      const msg: string = error.response.data?.message ?? 'An account with this email already exists';
      throw new Error(msg);
    }
    throw error;
  }
}

// ─── Profile fetch (role-aware) ──────────────────────────────────────────────

type BasicProfileData = {
  profileId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  website?: string;
};

type RecruiterProfileData = {
  profileId: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  photoUrl?: string;
  countryCode?: string;
  industry?: string;
  companyWebsite?: string;
  companySize?: string;
  companyDescription?: string;
};

async function getBasicProfile(): Promise<Partial<Profile>> {
  const response = await api.get<BackendApiResponse<BasicProfileData>>('/v1/profile/basic');
  const p = response.data.data;
  return {
    name:     `${p.firstName || ''} ${p.lastName || ''}`.trim(),
    avatar:   p.photoUrl   || '',
    phone:    p.phoneNumber || '',
    bio:      p.bio        || '',
    location: p.location   || '',
    website:  p.website    || '',
  };
}

async function getRecruiterProfile(profileId: string): Promise<Partial<Profile>> {
  const response = await api.get<BackendApiResponse<RecruiterProfileData>>(
    `/v1/recruiter/profile/${profileId}`
  );
  const p = response.data.data;
  return {
    name:     `${p.firstName || ''} ${p.lastName || ''}`.trim(),
    avatar:   p.photoUrl    || '',
    location: p.countryCode || '',
    bio:      '',
  };
}

/** Kept for backward compatibility — routes to the correct endpoint by role. */
async function getProfile(profileId: string, role?: ProfileRole): Promise<Partial<Profile>> {
  if (role === 'recruiter') return getRecruiterProfile(profileId);
  return getBasicProfile();
}

async function updateProfile(
  profileId: string,
  data: ProfileUpdatePayload
): Promise<Profile> {
  const response = await api.put(
    `/v1/recruiter/profile/${profileId}`,
    {
      firstName:   data.firstName || data.name?.split(' ')[0] || '',
      lastName:    data.lastName  || data.name?.split(' ').slice(1).join(' ') || '',
      photoUrl:    data.photoUrl  || data.avatar || '',
      countryCode: data.country   || data.location || '',
      phoneNumber: data.phone     || '',
    }
  );

  const profile = response.data.data;

  return {
    id:         profile.profileId ?? profileId,
    profile_id: profile.profileId ?? profileId,
    name:       `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
    firstName:  profile.firstName,
    lastName:   profile.lastName,
    email:      data.email || '',
    avatar:     profile.photoUrl || '',
    location:   profile.countryCode || '',
    phone:      profile.phoneNumber || '',
    bio:        profile.bio || '',
    ...data,
  } as Profile;
}

async function logout(): Promise<void> {
  // Aquí podrías llamar a un endpoint de logout si fuera necesario
}

// ─── Recruiter-specific company endpoints ────────────────────────────────────

type CompanyProfileRequest = {
  companyName: string;
  industry: string;
  companySize: string;
  companyWebsite?: string;
  companyDescription?: string;
  countryCode?: string;
};

async function getCompanyProfile(profileId: string): Promise<RecruiterProfileData> {
  const response = await api.get<BackendApiResponse<RecruiterProfileData>>(
    `/v1/recruiter/profile/company/${profileId}`
  );
  return response.data.data;
}

async function updateCompanyProfile(
  profileId: string,
  companyData: CompanyProfileRequest
): Promise<RecruiterProfileData> {
  const response = await api.put<BackendApiResponse<RecruiterProfileData>>(
    `/v1/recruiter/profile/company/${profileId}`,
    companyData
  );
  return response.data.data;
}

type UpdateRecruiterIdentityRequest = {
  firstName: string;
  lastName: string;
  countryCode?: string;
  phoneNumber?: string;
  photoUrl?: string;
};

async function updateRecruiterIdentity(
  profileId: string,
  identityData: UpdateRecruiterIdentityRequest
): Promise<RecruiterProfileData> {
  const response = await api.put<BackendApiResponse<RecruiterProfileData>>(
    `/v1/recruiter/profile/${profileId}`,
    identityData
  );
  return response.data.data;
}

export const authService = {
  login,
  registerLocal,
  updateProfile,
  getProfile,
  getBasicProfile,
  getRecruiterProfile,
  logout,
  getCompanyProfile,
  updateCompanyProfile,
  updateRecruiterIdentity,
  ROLE_DISPLAY_NAMES,
  ROLE_REDIRECT_PATHS,
};

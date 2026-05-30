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

  // 🔥 AQUI ESTABA EL BUG PRINCIPAL DEL FRONTEND
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
    expiresIn: 86400,
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

async function getProfile(profileId: string): Promise<Partial<Profile>> {
  const response = await api.get(`/v1/recruiter/profile/${profileId}`);
  const profile = response.data.data;

  // Mapa inverso de countryId → nombre del país
  const COUNTRY_NAME_MAP: Record<number, string> = {
    1: 'Argentina', 2: 'Bolivia', 3: 'Brasil', 4: 'Chile',
    5: 'Colombia', 6: 'Costa Rica', 7: 'Cuba', 8: 'Ecuador',
    9: 'El Salvador', 10: 'España', 11: 'Guatemala', 12: 'Honduras',
    13: 'México', 14: 'Nicaragua', 15: 'Panamá', 16: 'Paraguay',
    17: 'Perú', 18: 'República Dominicana', 19: 'Uruguay', 20: 'Venezuela',
  };

  return {
    name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
    avatar: profile.photoUrl || '',
    location: profile.countryId ? COUNTRY_NAME_MAP[profile.countryId] || '' : '', // ✅ countryId → nombre
    phone: profile.phoneNumber || '',   // ✅ phoneNumber, no phone
    bio: profile.bio || '',
    status: profile.availabilityStatus || 'Disponible',
    seniority: profile.seniority || 'Junior',
  };
}

async function updateProfile(
  profileId: string,
  data: ProfileUpdatePayload
): Promise<Profile> {
  const response = await api.put(
    `/v1/recruiter/profile/${profileId}`,
    {
      firstName: data.firstName || data.name?.split(' ')[0] || '',
      lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
      bio: data.bio || '',
      photoUrl: data.photoUrl || data.avatar || '',
      country: data.country || data.location || '',
      phone: data.phone || '',
      availabilityStatus:
        data.availabilityStatus || data.status || 'Disponible',
      seniority: data.seniority || 'Junior',
    }
  );

  const profile = response.data.data;

  return {
    id: profile.profileId ?? profileId,
    profile_id: profile.profileId ?? profileId,
    name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: data.email || '',
    avatar: profile.photoUrl || '',
    location: profile.country || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
    status: profile.availabilityStatus || 'Disponible',
    seniority: profile.seniority || 'Junior',
    ...data,
  } as Profile;
}

async function logout(): Promise<void> {
  // Aquí podrías llamar a un endpoint de logout si fuera necesario
}

// ============ FUNCIONES ESPECÍFICAS PARA PERFIL DE EMPRESA DEL RECLUTADOR ============

type CompanyProfileRequest = {
  companyName: string;
  industry: string;
  companySize: number;
  nit: string;
  contactFirstName: string;
  contactLastName: string;
  websiteUrl?: string;
};

type CompanyProfileResponse = {
  profileId: string;
  nit: string;
  companyName: string;
  industry: string;
  contactFirstName: string;
  contactLastName: string;
  websiteUrl?: string;
  companySize: number;
};

async function getCompanyProfile(profileId: string): Promise<CompanyProfileResponse> {
  const response = await api.get<BackendApiResponse<CompanyProfileResponse>>(
    `/v1/recruiter/profile/company/${profileId}`
  );
  return response.data.data;
}

async function updateCompanyProfile(
  profileId: string,
  companyData: CompanyProfileRequest
): Promise<CompanyProfileResponse> {
  const response = await api.put<BackendApiResponse<CompanyProfileResponse>>(
    `/v1/recruiter/profile/company/${profileId}`,
    companyData
  );
  return response.data.data;
}

type UpdateRecruiterIdentityRequest = {
  firstName: string;
  lastName: string;
  countryId?: number;
  phoneNumber?: string;
  photoUrl?: string;
};

type RecruiterIdentityResponse = {
  profileId: string;
  firstName: string;
  lastName: string;
  countryId?: number;
  phoneNumber?: string;
  photoUrl?: string;
};

async function updateRecruiterIdentity(
  profileId: string,
  identityData: UpdateRecruiterIdentityRequest
): Promise<RecruiterIdentityResponse> {
  const response = await api.put<BackendApiResponse<RecruiterIdentityResponse>>(
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
  logout,
  getCompanyProfile,
  updateCompanyProfile,
  updateRecruiterIdentity,
  ROLE_DISPLAY_NAMES,
  ROLE_REDIRECT_PATHS,
};
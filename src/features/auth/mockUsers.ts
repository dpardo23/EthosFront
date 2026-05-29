import type { User } from '@/shared/types';

const SEED = 'ethoshub-demo';

export const MOCK_USERS: User[] = [
  {
    id: 'mock-recruiter-001',
    email: 'r@ethos.com',
    name: 'Reclutador Demo',
    username: 'reclutador-demo',
    role: 'recruiter',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${SEED}-recruiter`,
    profile_id: 'mock-profile-recruiter',
    slug: 'reclutador-demo',
    profession: 'Reclutador',
    bio: 'Cuenta demo de reclutador',
    headline: 'Encontrando talento verificado',
    location: 'Bolivia',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-professional-001',
    email: 'p@ethos.com',
    name: 'Profesional Demo',
    username: 'profesional-demo',
    role: 'professional',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${SEED}-professional`,
    profile_id: 'mock-profile-professional',
    slug: 'profesional-demo',
    profession: 'Software Developer',
    bio: 'Cuenta demo de profesional',
    headline: 'Construyendo mi perfil profesional',
    location: 'Bolivia',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-admin-001',
    email: 'a@ethos.com',
    name: 'Administrador Demo',
    username: 'admin-demo',
    role: 'admin',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${SEED}-admin`,
    profile_id: 'mock-profile-admin',
    slug: 'admin-demo',
    profession: 'Administrador',
    bio: 'Cuenta demo de administrador',
    headline: 'Gestión del sistema EthosHub',
    location: 'Bolivia',
    createdAt: new Date().toISOString(),
  },
];

export function findMockUser(email: string): User | null {
  const normalized = email.toLowerCase().trim();
  return MOCK_USERS.find((u) => u.email === normalized) ?? null;
}

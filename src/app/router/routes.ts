import type { ProfileRole } from '@/shared/types';

export const ROUTES = {
  // ── Public ───────────────────────────────────────────────────────────────
  HOME:           '/',
  LOGIN:          '/login',
  REGISTER:       '/register',
  OAUTH_CALLBACK: '/oauth2/callback',
  OAUTH_SUCCESS:  '/oauth-success',
  EXPLORE:        '/explorar',
  PRIVACY:        '/privacidad',
  TERMS:          '/terminos',
  ACCESS_DENIED:  '/access-denied',

  // ── Professional ─────────────────────────────────────────────────────────
  PROFESSIONAL_PORTFOLIO:    '/dashboard/portfolio',
  PROFESSIONAL_SKILLS:       '/dashboard/skills',
  PROFESSIONAL_PROJECTS:     '/dashboard/projects',
  PROFESSIONAL_EXPERIENCE:   '/dashboard/experience',
  PROFESSIONAL_EDUCATION:    '/dashboard/education',
  PROFESSIONAL_CV:           '/dashboard/cv-studio',
  PROFESSIONAL_CONNECTIONS:  '/dashboard/connections',
  PROFESSIONAL_CHAT:         '/dashboard/chat',
  PROFESSIONAL_VISIBILITY:   '/dashboard/visibility',
  // Initial redirect after login — immutable
  PROFESSIONAL_SETTINGS:     '/dashboard/profesional/configuracion',

  // ── Recruiter ─────────────────────────────────────────────────────────────
  RECRUITER_DASHBOARD:       '/recruiter/dashboard',
  RECRUITER_TALENT:          '/recruiter/talent-discovery',
  RECRUITER_CHAT:            '/recruiter/chat',
  RECRUITER_LIKES:           '/recruiter/likes',
  // Initial redirect after login — immutable
  RECRUITER_SETTINGS:        '/dashboard/reclutador/configuracion',

  // ── Admin ─────────────────────────────────────────────────────────────────
  ADMIN_DASHBOARD:           '/admin/dashboard',
  ADMIN_PROFILES:            '/admin/profiles',
  ADMIN_MODERATION:          '/admin/moderation',
  ADMIN_SKILLS:              '/admin/skills',
  ADMIN_PORTFOLIOS:          '/admin/portfolios',
  ADMIN_DOMAINS:             '/admin/domains',
} as const;

/** Destination immediately after a successful login — never overridden. */
export const ROLE_INITIAL_PATHS: Record<ProfileRole, string> = {
  professional: ROUTES.PROFESSIONAL_SETTINGS,
  recruiter:    ROUTES.RECRUITER_SETTINGS,
  admin:        ROUTES.ADMIN_DASHBOARD,
  guest:        ROUTES.HOME,
};

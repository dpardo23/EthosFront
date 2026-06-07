import type { ProfileRole } from '@/shared/types';

/**
 * Centralized route path constants used throughout the app to avoid hard-coded strings.
 */
export const ROUTES = {
  
  HOME:           '/',
  LOGIN:          '/login',
  REGISTER:       '/register',
  OAUTH_CALLBACK: '/oauth2/callback',
  OAUTH_SUCCESS:  '/oauth-success',
  EXPLORE:        '/explorar',
  PRIVACY:        '/privacidad',
  TERMS:          '/terminos',
  ACCESS_DENIED:  '/access-denied',

  
  PROFESSIONAL_PORTFOLIO:    '/dashboard/portfolio',
  PROFESSIONAL_SKILLS:       '/dashboard/skills',
  PROFESSIONAL_PROJECTS:     '/dashboard/projects',
  PROFESSIONAL_EXPERIENCE:   '/dashboard/experience',
  PROFESSIONAL_EDUCATION:    '/dashboard/education',
  PROFESSIONAL_CV:           '/dashboard/cv-studio',
  PROFESSIONAL_CONNECTIONS:  '/dashboard/connections',
  PROFESSIONAL_CHAT:         '/dashboard/chat',
  PROFESSIONAL_VISIBILITY:   '/dashboard/visibility',
  
  PROFESSIONAL_SETTINGS:     '/dashboard/profesional/configuracion',

  
  RECRUITER_DASHBOARD:       '/recruiter/dashboard',
  RECRUITER_TALENT:          '/recruiter/talent-discovery',
  RECRUITER_CHAT:            '/recruiter/chat',
  RECRUITER_LIKES:           '/recruiter/likes',
  
  RECRUITER_SETTINGS:        '/dashboard/reclutador/configuracion',

  
  ADMIN_DASHBOARD:           '/admin/dashboard',
  ADMIN_PROFILES:            '/admin/profiles',
  ADMIN_MODERATION:          '/admin/moderation',
  ADMIN_SKILLS:              '/admin/skills',
  ADMIN_PORTFOLIOS:          '/admin/portfolios',
  ADMIN_DOMAINS:             '/admin/domains',
} as const;

export const ROLE_INITIAL_PATHS: Record<ProfileRole, string> = {
  professional: ROUTES.PROFESSIONAL_SETTINGS,
  recruiter:    ROUTES.RECRUITER_SETTINGS,
  admin:        ROUTES.ADMIN_DASHBOARD,
  guest:        ROUTES.HOME,
};

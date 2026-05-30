import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ROUTES } from './routes';
import { DashboardLayout, AdminLayout, AuthLayout, PublicPortfolioLayout } from '../layouts';
import { ProtectedRoute } from './ProtectedRoute';
import RouteErrorBoundary from './RouteErrorBoundary';
import { Skeleton } from '@/shared/ui';

// Lazy loaded pages
const LoginPage                  = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage               = lazy(() => import('@/pages/auth/RegisterPage'));
const OAuth2CallbackPage         = lazy(() => import('@/pages/auth/OAuth2CallbackPage'));
const HomePage                   = lazy(() => import('@/pages/public/HomePage'));
const DashboardHomePage          = lazy(() => import('@/pages/dashboard/DashboardHomePage'));
const SkillsPage                 = lazy(() => import('@/pages/dashboard/SkillsPage'));
const ProjectsPage               = lazy(() => import('@/pages/dashboard/ProjectsPage'));
const ProjectDetailPage          = lazy(() => import('@/pages/dashboard/ProjectDetailPage'));
const ConnectionsPage            = lazy(() => import('@/pages/dashboard/ConnectionsPage'));
const VisibilityPage             = lazy(() => import('@/pages/dashboard/VisibilityPage'));
const ExperiencePage             = lazy(() => import('@/pages/dashboard/ExperiencePage'));
const EducationPage              = lazy(() => import('@/pages/dashboard/EducationPage'));
const PreferencesPage            = lazy(() => import('@/pages/dashboard/PreferencesPage'));
const PortfolioPage              = lazy(() => import('@/pages/dashboard/PortfolioPage'));
const CVStudioPage               = lazy(() => import('@/pages/dashboard/CVStudioPage'));
const AdminDashboardPage         = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminProfilesPage          = lazy(() => import('@/pages/admin/AdminProfilesPage'));
const AdminModerationPage        = lazy(() => import('@/pages/admin/AdminModerationPage'));
const AdminSkillsPage            = lazy(() => import('@/pages/admin/AdminSkillsPage'));
const AdminPortfoliosPage        = lazy(() => import('@/pages/admin/AdminPortfoliosPage'));
const AdminDomainsPage           = lazy(() => import('@/pages/admin/AdminDomainsPage'));
const ExplorePage                = lazy(() => import('@/pages/public/ExplorePage'));
const PublicPortfolioPage        = lazy(() => import('@/pages/public/PublicPortfolioPage'));
const PasswordPortfolioPage      = lazy(() => import('@/pages/public/PasswordPortfolioPage'));
const NotFoundPage               = lazy(() => import('@/pages/NotFoundPage'));
const AccessDeniedPage           = lazy(() => import('@/pages/AccessDeniedPage'));
const RecruiterSettingsPage      = lazy(() => import('@/pages/dashboard/RecruiterSettingsPage'));
const RecruiterDashboardPage     = lazy(() => import('@/pages/recruiter/RecruiterDashboardPage'));
const TalentDiscoveryPage        = lazy(() => import('@/pages/recruiter/TalentDiscoveryPage'));
const RecruiterPortfolioPage     = lazy(() => import('@/pages/recruiter/RecruiterPortfolioPage'));
const RecruiterProjectDetailPage = lazy(() => import('@/pages/recruiter/RecruiterProjectDetailPage'));
const PrivacyPage                = lazy(() => import('@/pages/public/PrivacyPage'));
const TermsPage                  = lazy(() => import('@/pages/public/TermsPage'));

function PageLoader() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function S({ page: Page }: { page: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // ── Auth (public) ────────────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'login',          element: <S page={LoginPage} /> },
      { path: 'register',       element: <S page={RegisterPage} /> },
      { path: 'oauth2/callback', element: <S page={OAuth2CallbackPage} /> },
      { path: 'oauth-success',  element: <S page={OAuth2CallbackPage} /> },
    ],
  },

  // ── Professional dashboard (professional + admin only) ────────────────────────
  {
    element: (
      <ProtectedRoute allowedRoles={['professional', 'admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'dashboard',                                             element: <Navigate to={ROUTES.PROFESSIONAL_PORTFOLIO} replace /> },
      { path: 'dashboard/portfolio',                                   element: <S page={PortfolioPage} /> },
      { path: 'dashboard/cv-studio',                                   element: <S page={CVStudioPage} /> },
      { path: 'dashboard/skills',                                      element: <S page={SkillsPage} /> },
      { path: 'dashboard/projects',                                    element: <S page={ProjectsPage} /> },
      { path: 'dashboard/projects/:projectId',                         element: <S page={ProjectDetailPage} /> },
      { path: 'dashboard/connections',                                  element: <S page={ConnectionsPage} /> },
      { path: 'dashboard/visibility',                                   element: <S page={VisibilityPage} /> },
      { path: 'dashboard/experience',                                   element: <S page={ExperiencePage} /> },
      { path: 'dashboard/education',                                    element: <S page={EducationPage} /> },
      // Legacy alias kept for bookmarks
      { path: 'dashboard/preferences',                                  element: <Navigate to={ROUTES.PROFESSIONAL_SETTINGS} replace /> },
      // Canonical post-login destination for professionals
      { path: 'dashboard/profesional/configuracion',                    element: <S page={PreferencesPage} /> },
    ],
  },

  // ── Recruiter dashboard (recruiter + admin only) ──────────────────────────────
  {
    element: (
      <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'recruiter/dashboard',                                   element: <S page={RecruiterDashboardPage} /> },
      { path: 'recruiter/talent-discovery',                            element: <S page={TalentDiscoveryPage} /> },
      { path: 'recruiter/talent/:profileId/portfolio',                 element: <S page={RecruiterPortfolioPage} /> },
      { path: 'recruiter/talent/:profileId/portfolio/:projectId',      element: <S page={RecruiterProjectDetailPage} /> },
      // Canonical post-login destination for recruiters
      { path: 'dashboard/reclutador/configuracion',                    element: <S page={RecruiterSettingsPage} /> },
    ],
  },

  // ── Admin panel ───────────────────────────────────────────────────────────────
  {
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'admin/dashboard',  element: <S page={AdminDashboardPage} /> },
      { path: 'admin/profiles',   element: <S page={AdminProfilesPage} /> },
      { path: 'admin/moderation', element: <S page={AdminModerationPage} /> },
      { path: 'admin/skills',     element: <S page={AdminSkillsPage} /> },
      { path: 'admin/portfolios', element: <S page={AdminPortfoliosPage} /> },
      { path: 'admin/domains',    element: <S page={AdminDomainsPage} /> },
    ],
  },

  // ── Public ───────────────────────────────────────────────────────────────────
  {
    path: '/talent',
    errorElement: <RouteErrorBoundary />,
    element: <S page={TalentDiscoveryPage} />,
  },
  {
    element: <PublicPortfolioLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/',              element: <S page={HomePage} /> },
      { path: 'explorar',       element: <S page={ExplorePage} /> },
      { path: 'p/:slug',        element: <S page={PublicPortfolioPage} /> },
      { path: 'p/:slug/password', element: <S page={PasswordPortfolioPage} /> },
      { path: 'privacidad',     element: <S page={PrivacyPage} /> },
      { path: 'terminos',       element: <S page={TermsPage} /> },
    ],
  },
  {
    path: 'access-denied',
    errorElement: <RouteErrorBoundary />,
    element: <S page={AccessDeniedPage} />,
  },
  {
    path: '*',
    errorElement: <RouteErrorBoundary />,
    element: <S page={NotFoundPage} />,
  },
], {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  future: { v7_startTransition: true } as any,
});

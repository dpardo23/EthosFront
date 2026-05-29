import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { DashboardLayout, AdminLayout, AuthLayout, PublicPortfolioLayout } from '../layouts';
import { ProtectedRoute } from './ProtectedRoute';
import RouteErrorBoundary from './RouteErrorBoundary';
import { Skeleton } from '@/shared/ui';

// Lazy loaded pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const OAuth2CallbackPage = lazy(() => import('@/pages/auth/OAuth2CallbackPage'));
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const DashboardHomePage = lazy(() => import('@/pages/dashboard/DashboardHomePage'));
const SkillsPage = lazy(() => import('@/pages/dashboard/SkillsPage'));
const ProjectsPage = lazy(() => import('@/pages/dashboard/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/dashboard/ProjectDetailPage'));
const ConnectionsPage = lazy(() => import('@/pages/dashboard/ConnectionsPage'));
const VisibilityPage = lazy(() => import('@/pages/dashboard/VisibilityPage'));
const ExperiencePage = lazy(() => import('@/pages/dashboard/ExperiencePage'));
const EducationPage = lazy(() => import('@/pages/dashboard/EducationPage'));
const PreferencesPage = lazy(() => import('@/pages/dashboard/PreferencesPage'));
const PortfolioPage = lazy(() => import('@/pages/dashboard/PortfolioPage'));
const CVStudioPage = lazy(() => import('@/pages/dashboard/CVStudioPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminProfilesPage = lazy(() => import('@/pages/admin/AdminProfilesPage'));
const AdminModerationPage = lazy(() => import('@/pages/admin/AdminModerationPage'));
const AdminSkillsPage = lazy(() => import('@/pages/admin/AdminSkillsPage'));
const AdminPortfoliosPage = lazy(() => import('@/pages/admin/AdminPortfoliosPage'));
const AdminDomainsPage = lazy(() => import('@/pages/admin/AdminDomainsPage'));
const ExplorePage = lazy(() => import('@/pages/public/ExplorePage'));
const PublicPortfolioPage = lazy(() => import('@/pages/public/PublicPortfolioPage'));
const PasswordPortfolioPage = lazy(() => import('@/pages/public/PasswordPortfolioPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AccessDeniedPage = lazy(() => import('@/pages/AccessDeniedPage'));
const RecruiterDashboardPage = lazy(() => import('@/pages/recruiter/RecruiterDashboardPage'));
const TalentDiscoveryPage = lazy(() => import('@/pages/recruiter/TalentDiscoveryPage'));
const RecruiterPortfolioPage = lazy(() => import('@/pages/recruiter/RecruiterPortfolioPage'));
const RecruiterProjectDetailPage = lazy(() => import('@/pages/recruiter/RecruiterProjectDetailPage'));
const PrivacyPage = lazy(() => import('@/pages/public/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/public/TermsPage'));

function PageLoader() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'login',
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: 'oauth2/callback',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OAuth2CallbackPage />
          </Suspense>
        ),
      },
      {
        path: 'oauth-success',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OAuth2CallbackPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    element: (
      <ProtectedRoute allowedRoles={['professional', 'recruiter', 'admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        element: <Navigate to="/dashboard/portfolio" replace />,
      },
      {
        path: 'dashboard/portfolio',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PortfolioPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/cv-studio',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CVStudioPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/skills',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SkillsPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/projects',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProjectsPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/projects/:projectId',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProjectDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/connections',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ConnectionsPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/visibility',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VisibilityPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/experience',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExperiencePage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/education',
        element: (
          <Suspense fallback={<PageLoader />}>
            <EducationPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/preferences',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PreferencesPage />
          </Suspense>
        ),
      },
      {
        path: 'recruiter/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RecruiterDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'recruiter/talent-discovery',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TalentDiscoveryPage />
          </Suspense>
        ),
      },
      {
    path: 'recruiter/talent/:profileId/portfolio',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RecruiterPortfolioPage />
      </Suspense>
    ),
  },
  {
    path: 'recruiter/talent/:profileId/portfolio/:projectId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RecruiterProjectDetailPage />
      </Suspense>
    ),
  },
    ],
  },
  {
    path: '/talent',
    errorElement: <RouteErrorBoundary />,
    element: (
      <Suspense fallback={<PageLoader />}>
        <TalentDiscoveryPage />
      </Suspense>
    ),
  },
  {
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'admin/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'admin/profiles',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminProfilesPage />
          </Suspense>
        ),
      },
      {
        path: 'admin/moderation',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminModerationPage />
          </Suspense>
        ),
      },
      {
        path: 'admin/skills',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminSkillsPage />
          </Suspense>
        ),
      },
      {
        path: 'admin/portfolios',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPortfoliosPage />
          </Suspense>
        ),
      },
      {
        path: 'admin/domains',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminDomainsPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    element: <PublicPortfolioLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'explorar',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExplorePage />
          </Suspense>
        ),
      },
      {
        path: 'p/:slug',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PublicPortfolioPage />
          </Suspense>
        ),
      },
      {
        path: 'p/:slug/password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PasswordPortfolioPage />
          </Suspense>
        ),
      },
      {
        path: 'privacidad',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PrivacyPage />
          </Suspense>
        ),
      },
      {
        path: 'terminos',
        element: (
          <Suspense fallback={<PageLoader />}>
            <TermsPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: 'access-denied',
    errorElement: <RouteErrorBoundary />,
    element: (
      <Suspense fallback={<PageLoader />}>
        <AccessDeniedPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    errorElement: <RouteErrorBoundary />,
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
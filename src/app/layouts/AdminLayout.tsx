import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Code2,
  Users,
  LogOut,
  Shield,
  AlertTriangle,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore, useUiStore } from '@/store';
import { Avatar, Badge } from '@/shared/ui';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

/**
 * Layout shell for admin panel pages.
 * Desktop (lg+): topbar with centered navigation, sidebar hidden.
 * Mobile (<lg): slim header with hamburger; sidebar drawer is the primary navigation.
 */
const adminNavItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Métricas Globales' },
  { path: '/admin/profiles', icon: Users, label: 'Gestión de Perfiles' },
  { path: '/admin/moderation', icon: AlertTriangle, label: 'Moderación' },
  { path: '/admin/skills', icon: Code2, label: 'Skills' },
  { path: '/admin/email', icon: Mail, label: 'Email' },
];

export function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuthStore();
  const { initializeTheme } = useUiStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen max-w-full flex-col overflow-hidden bg-gray-50 transition-colors duration-300 dark:bg-black">
      <header className="z-30 flex h-16 shrink-0 items-center border-b border-gray-200 bg-white/95 px-4 backdrop-blur transition-colors duration-300 supports-[backdrop-filter]:bg-white/80 md:px-6 dark:border-white/10 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="flex flex-1 items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-violet-500/10 hover:text-violet-600 lg:hidden dark:border-white/10 dark:text-gray-400 dark:hover:text-violet-400"
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="hidden font-sans text-base font-bold text-black sm:inline dark:text-white">EthosHub</span>
            <Badge className="border-0 bg-violet-500/10 text-[10px] text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              Admin
            </Badge>
          </div>
        </div>

        <nav className="hidden items-center justify-center gap-1 lg:flex" aria-label="Navegación principal">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                    : 'text-gray-500 hover:bg-violet-500/10 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <ThemeToggle size="sm" className="hidden border-gray-200 hover:border-violet-500/50 hover:bg-violet-500/10 lg:inline-flex dark:border-white/10" />
          <div className="hidden items-center gap-2 lg:flex">
            <Avatar src={profile?.avatar} alt={profile?.name} fallback={profile?.name} size="sm" className="border border-violet-500/30" />
            <div className="hidden min-w-0 xl:block">
              <p className="max-w-[140px] truncate text-sm font-medium text-black dark:text-white">{profile?.name}</p>
              <p className="text-xs text-violet-600 dark:text-violet-400">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="hidden h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-600 lg:flex dark:border-white/10 dark:text-gray-400 dark:hover:text-violet-400"
            aria-label={t('nav.logout')}
            title={t('nav.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:hidden dark:border-white/10 dark:bg-zinc-950',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-sans text-lg font-bold text-black dark:text-white">EthosHub</span>
              <Badge className="ml-2 border-0 bg-violet-500/10 text-[10px] text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                Admin
              </Badge>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-violet-500/10 hover:text-violet-600 dark:text-gray-400"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4" aria-label="Navegación principal">
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                        : 'text-gray-500 hover:bg-violet-500/10 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-white/10">
          <div className="mb-4 flex items-center justify-center">
            <ThemeToggle size="md" className="border-gray-200 hover:border-violet-500/50 hover:bg-violet-500/10 dark:border-white/10" />
          </div>
          <div className="flex items-center gap-3">
            <Avatar src={profile?.avatar} alt={profile?.name} fallback={profile?.name} size="md" className="border border-violet-500/30" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-black dark:text-white">{profile?.name}</p>
              <p className="truncate text-xs text-violet-600 dark:text-violet-400">Administrador</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-500 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-600 dark:border-white/10 dark:text-gray-400 dark:hover:text-violet-400"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 transition-colors duration-300 dark:bg-black">
        <Outlet />
      </main>
    </div>
  );
}

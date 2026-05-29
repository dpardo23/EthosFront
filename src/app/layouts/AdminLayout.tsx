import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Code2,
  Users,
  ArrowLeft,
  LogOut,
  Shield,
  AlertTriangle,
  Menu,
  X,
  Globe, // Nuevo icono para dominios
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore, useUiStore } from '@/store';
import { Avatar, Badge } from '@/shared/ui';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const adminNavItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Metricas Globales' },
  { path: '/admin/users', icon: Users, label: 'Gestion de Usuarios' },
  { path: '/admin/moderation', icon: AlertTriangle, label: 'Moderacion' },
  { path: '/admin/skills', icon: Code2, label: 'Normalizacion de Skills' },
  { path: '/admin/domains', icon: Globe, label: 'Gestión de Dominios' }, // Nueva Pestaña
];

export function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { resolvedTheme, initializeTheme } = useUiStore();
  const isDark = resolvedTheme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen max-w-full overflow-x-hidden bg-gray-50 dark:bg-black">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 dark:border-white/10 dark:bg-zinc-950 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4 dark:border-white/10">
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

        <div className="border-b border-gray-200 p-4 dark:border-white/10">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
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
            <Avatar src={user?.avatar} alt={user?.name} fallback={user?.name} size="md" className="border border-violet-500/30" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-black dark:text-white">{user?.name}</p>
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

      <div className="flex flex-1 flex-col bg-gray-50 dark:bg-black lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:px-6 dark:border-white/10 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-violet-500/10 hover:text-violet-600 lg:hidden dark:border-white/10 dark:text-gray-400 dark:hover:text-violet-400"
              aria-label={sidebarOpen ? 'Cerrar menu' : 'Abrir menu'}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="font-sans text-base font-semibold text-black dark:text-white md:text-lg">Panel de Administracion</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-black">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
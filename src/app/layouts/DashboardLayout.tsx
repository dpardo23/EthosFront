import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Code2,
  FolderKanban,
  Link2,
  Briefcase,
  GraduationCap,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Globe,
  User,
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SplitSquareHorizontal,
  LayoutDashboard,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore, useUiStore, useNotificationsStore } from '@/store';
import { Avatar } from '@/shared/ui';
import { EthosCoreLogo, EthosLogoIcon } from '@/components/brand/EthosCoreLogo';
import type { UserRole } from '@/shared/types';

type NavItem = {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: string;
};

// CV Studio positioned after Educación, before Conexiones
const professionalNavItems: NavItem[] = [
  { path: '/dashboard/portfolio',   icon: LayoutGrid,            label: 'Mi Portafolio' },
  { path: '/dashboard/skills',      icon: Code2,                 label: 'Habilidades' },
  { path: '/dashboard/projects',    icon: FolderKanban,          label: 'Proyectos' },
  { path: '/dashboard/experience',  icon: Briefcase,             label: 'Experiencia' },
  { path: '/dashboard/education',   icon: GraduationCap,         label: 'Educación' },
  { path: '/dashboard/cv-studio',   icon: SplitSquareHorizontal, label: 'CV Studio' },
  { path: '/dashboard/connections', icon: Link2,                 label: 'Conexiones' },
  { path: '/dashboard/preferences', icon: Settings,              label: 'Configuración' },
];

const recruiterNavItems: NavItem[] = [
  { path: '/recruiter/dashboard',        icon: LayoutDashboard, label: 'Panel Principal' },
  { path: '/recruiter/talent-discovery', icon: Search,          label: 'Buscar Talento' },
  { path: '/dashboard/preferences',      icon: Settings,        label: 'Configuración' },
];

const adminNavItems: NavItem[] = [
  { path: '/admin/dashboard',       icon: LayoutDashboard, label: 'Panel Admin' },
  { path: '/dashboard/preferences', icon: Settings,        label: 'Configuración' },
];

function getNavItems(role: UserRole): NavItem[] {
  if (role === 'recruiter') return recruiterNavItems;
  if (role === 'admin') return adminNavItems;
  return professionalNavItems;
}

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

// ── Sidebar nav item ──────────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link to={item.path} className="block">
      <motion.div
        className={cn(
          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer overflow-hidden',
          isActive
            ? 'text-violet-700 dark:text-white'
            : 'text-muted-foreground hover:text-foreground'
        )}
        whileHover={{ x: 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="sidebar-active-bg"
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/15 to-violet-500/5 dark:from-violet-600/25 dark:to-violet-500/10 border border-violet-500/25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="sidebar-active-bar"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-violet-500 dark:bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 bg-foreground/[0.04]"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        />

        <motion.div
          className="relative z-10 shrink-0"
          animate={isActive ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Icon
            className={cn(
              'h-4 w-4 transition-colors duration-200',
              isActive ? 'text-violet-500 dark:text-violet-400' : 'text-muted-foreground'
            )}
          />
        </motion.div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              className="relative z-10 truncate"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {item.badge && !collapsed && (
          <span className="relative z-10 ml-auto shrink-0 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400">
            {item.badge}
          </span>
        )}
      </motion.div>
    </Link>
  );
}

// ── Shared sidebar body (mobile + desktop) ────────────────────────────────────

type SidebarProfile = {
  name?: string | null;
  role?: UserRole | null;
  slug?: string | null;
  email?: string | null;
  avatar?: string | null;
} | null;

function SidebarContent({
  collapsed,
  profile,
  navItems,
  pathname,
  onClose,
  onToggleCollapse,
}: {
  collapsed: boolean;
  profile: SidebarProfile;
  navItems: NavItem[];
  pathname: string;
  onClose: () => void;
  onToggleCollapse: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className={cn(
        'flex h-14 shrink-0 items-center border-b border-border',
        collapsed ? 'justify-center px-0' : 'justify-between px-4'
      )}>
        <Link to="/dashboard/cv-studio" className="flex items-center gap-2.5 min-w-0">
          <AnimatePresence initial={false} mode="wait">
            {!collapsed ? (
              <motion.div
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <EthosCoreLogo size="sm" />
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex h-7 w-7 items-center justify-center"
              >
                <EthosLogoIcon size={26} animate={false} />
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent lg:hidden"
          aria-label="Cerrar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 scrollbar-hide">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <SidebarNavItem key={item.path} item={item} isActive={isActive} collapsed={collapsed} />
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-2 space-y-1">
        {!collapsed && profile?.role === 'professional' && profile?.slug && (
          <Link
            to={`/p/${profile.slug}`}
            target="_blank"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:text-violet-500 hover:bg-violet-500/5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Ver portafolio público</span>
          </Link>
        )}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'hidden lg:flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Colapsar panel</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

export function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: profile, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, resolvedTheme, initializeTheme } = useUiStore();
  const { unreadCount } = useNotificationsStore();

  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const navItems = getNavItems(profile?.role || 'professional');
  const isDark = resolvedTheme === 'dark';
  const sidebarWidth = collapsed ? 64 : 240;

  // Idle logout
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        toast.error('Sesión cerrada por inactividad');
        logout().then(() => navigate('/login'));
      }, IDLE_TIMEOUT_MS);
    };
    const events = ['mousemove', 'keydown', 'wheel', 'mousedown', 'touchstart'];
    events.forEach(e => document.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer); events.forEach(e => document.removeEventListener(e, reset)); };
  }, [logout, navigate]);

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Theme sync
  useEffect(() => { if (initializeTheme) initializeTheme(); }, [initializeTheme]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Click outside topbar menus
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const fullName = profile?.name || 'Usuario';

  const sidebarStyle = isDark
    ? { background: 'linear-gradient(180deg, #0A0A0F 0%, #060608 100%)' }
    : undefined;

  const topbarStyle = isDark
    ? { background: 'rgba(6, 6, 8, 0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }
    : { background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };

  const dropdownCls = cn(
    'rounded-2xl border border-border shadow-2xl',
    isDark ? 'bg-zinc-900 shadow-black/50' : 'bg-white shadow-black/15',
  );

  return (
    <div className={cn('flex h-screen overflow-hidden', isDark ? 'bg-[#030305]' : 'bg-background')}>

      {/* ── Mobile sidebar — slides in from left, full-screen backdrop ──────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer panel */}
            <motion.aside
              className="fixed inset-y-0 left-0 z-[70] flex flex-col w-[280px] bg-background lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 35 }}
              style={sidebarStyle}
            >
              <SidebarContent
                collapsed={false}
                profile={profile}
                navItems={navItems}
                pathname={location.pathname}
                onClose={() => setSidebarOpen(false)}
                onToggleCollapse={() => setCollapsed(c => !c)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar — in-flow, animates width, has border-r ─────────── */}
      <motion.aside
        className="hidden lg:flex flex-col h-full shrink-0 border-r border-border"
        style={sidebarStyle}
        animate={{ width: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      >
        <SidebarContent
          collapsed={collapsed}
          profile={profile}
          navItems={navItems}
          pathname={location.pathname}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
      </motion.aside>

      {/* ── Main column ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">

        {/* ── Topbar ──────────────────────────────────────────────────────── */}
        <header
          className="relative z-[60] flex h-14 shrink-0 items-center justify-between gap-2 px-4 border-b border-border"
          style={topbarStyle}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Notificaciones"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={cn('absolute right-0 top-[calc(100%+8px)] z-[100] w-80 p-4', dropdownCls)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-popover-foreground">Notificaciones</p>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-500 dark:text-violet-300">
                          {unreadCount} nuevas
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {unreadCount > 0
                        ? `Tienes ${unreadCount} notificaciones sin leer.`
                        : 'Todo al día. No hay notificaciones nuevas.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex h-9 items-center gap-2 rounded-xl border border-border bg-muted/40 pl-1.5 pr-2.5 hover:bg-accent transition-all duration-150"
              >
                <Avatar src={profile?.avatar} alt={profile?.name} fallback={profile?.name} size="sm" />
                <span className="hidden sm:block text-xs font-medium text-foreground/90 max-w-[90px] truncate">
                  {fullName.split(' ')[0]}
                </span>
                <ChevronDown className={cn(
                  'h-3 w-3 text-muted-foreground transition-transform duration-200',
                  showUserMenu && 'rotate-180'
                )} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={cn('absolute right-0 top-[calc(100%+8px)] z-[100] w-60 py-1.5', dropdownCls)}
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <Avatar src={profile?.avatar} alt={profile?.name} fallback={profile?.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-popover-foreground truncate">{fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <span className="inline-flex items-center rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-300">
                          {t(`role.${profile?.role}`)}
                        </span>
                      </div>
                    </div>

                    <div className="py-1.5 px-1.5 space-y-0.5">
                      {profile?.role === 'professional' && profile?.slug && (
                        <Link
                          to={`/p/${profile.slug}`}
                          target="_blank"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Globe className="h-4 w-4" />
                          Ver portafolio
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </Link>
                      )}
                      {profile?.role === 'recruiter' && (
                        <Link
                          to="/explorar"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Globe className="h-4 w-4" />
                          Explorar portafolios
                        </Link>
                      )}
                      <Link
                        to="/dashboard/preferences"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="h-4 w-4" />
                        Mi perfil
                      </Link>

                      <div className="mx-2 my-1 border-t border-border" />

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────────────────── */}
        <div id="portal-root" className="relative flex-1 overflow-hidden">
          <main className="h-full overflow-y-auto bg-background">
            <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

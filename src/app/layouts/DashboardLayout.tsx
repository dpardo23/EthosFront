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
  Menu,
  X,
  LogOut,
  ChevronDown,
  Globe,
  User as ProfileIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  SplitSquareHorizontal,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore, useUiStore, useNotificationsStore } from '@/store';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Avatar } from '@/shared/ui';
import { EthosCoreLogo, EthosLogoIcon } from '@/components/brand/EthosCoreLogo';
import type { ProfileRole } from '@/shared/types';

type NavItem = {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: string;
};

// CV Studio positioned after Educación, before Conexiones
const professionalNavItems: NavItem[] = [
  { path: '/dashboard/portfolio',                   icon: LayoutGrid,            label: 'Mi Portafolio' },
  { path: '/dashboard/skills',                      icon: Code2,                 label: 'Habilidades' },
  { path: '/dashboard/projects',                    icon: FolderKanban,          label: 'Proyectos' },
  { path: '/dashboard/experience',                  icon: Briefcase,             label: 'Experiencia' },
  { path: '/dashboard/education',                   icon: GraduationCap,         label: 'Educación' },
  { path: '/dashboard/cv-studio',                   icon: SplitSquareHorizontal, label: 'CV Studio' },
  { path: '/dashboard/connections',                 icon: Link2,                 label: 'Conexiones' },
  { path: '/dashboard/chat',                        icon: MessageSquare,         label: 'Chat' },
  { path: '/dashboard/profesional/configuracion',   icon: Settings,              label: 'Configuración' },
];

const adminNavItems: NavItem[] = [
  { path: '/admin/dashboard',                       icon: LayoutDashboard, label: 'Panel Admin' },
  { path: '/dashboard/profesional/configuracion',   icon: Settings,        label: 'Configuración' },
];

function getNavItems(role: ProfileRole): NavItem[] {
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
  role?: ProfileRole | null;
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
  const { profile: profile, logout, isAuthResolved } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, resolvedTheme, initializeTheme } = useUiStore();
  const { addNotification } = useNotificationsStore();

  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const globalChatChannelRef = useRef<RealtimeChannel | null>(null);

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

  // Track current path in a ref so the Realtime callback can read it without
  // the channel being torn down and rebuilt on every navigation.
  const pathnameRef = useRef(location.pathname);
  useEffect(() => { pathnameRef.current = location.pathname; }, [location.pathname]);

  // Global Realtime channel: notify when a new message arrives for this user
  // even if they're not on the chat page. Created once per session (profile + auth).
  useEffect(() => {
    if (!profile?.id || !supabase || !isAuthResolved) return;
    const sb = supabase;

    // Re-inject JWT before subscribing to avoid race with async checkAuth on reload.
    const token = sessionStorage.getItem('ethoshub_access_token');
    if (token && !token.startsWith('mock-')) sb.realtime.setAuth(token);

    if (globalChatChannelRef.current) sb.removeChannel(globalChatChannelRef.current);

    const channel = sb
      .channel(`global-chat-pro:${profile.id}`)
      .on(
        'postgres_changes',
        // Filter server-side: only messages NOT sent by this user arriving in their chats.
        // RLS already restricts to rows the user can see, so no extra data leaks.
        { event: 'INSERT', schema: 'core', table: 'chat_messages', filter: `sender_id=neq.${profile.id}` },
        (payload) => {
          const msg = payload.new as { sender_id: string; content: string; chat_id: string };
          // Suppress bell notification when the user is already on the chat page.
          if (pathnameRef.current.startsWith('/dashboard/chat')) return;
          addNotification({
            type: 'message',
            title: 'Nuevo mensaje',
            message: msg.content.slice(0, 80),
          });
        }
      )
      .subscribe();

    globalChatChannelRef.current = channel;
    return () => { sb.removeChannel(channel); globalChatChannelRef.current = null; };
  }, [profile?.id, isAuthResolved, addNotification]);

  // Theme sync
  useEffect(() => { if (initializeTheme) initializeTheme(); }, [initializeTheme]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Click outside topbar menus
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
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

            {/* Profile menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(v => !v)}
                className="flex h-9 items-center gap-2 rounded-xl border border-border bg-muted/40 pl-1.5 pr-2.5 hover:bg-accent transition-all duration-150"
              >
                <Avatar src={profile?.avatar} alt={profile?.name} fallback={profile?.name} size="sm" />
                <span className="hidden sm:block text-xs font-medium text-foreground/90 max-w-[90px] truncate">
                  {fullName.split(' ')[0]}
                </span>
                <ChevronDown className={cn(
                  'h-3 w-3 text-muted-foreground transition-transform duration-200',
                  showProfileMenu && 'rotate-180'
                )} />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
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
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          onClick={() => setShowProfileMenu(false)}
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
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Globe className="h-4 w-4" />
                          Explorar portafolios
                        </Link>
                      )}
                      <Link
                        to="/dashboard/preferences"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <ProfileIcon className="h-4 w-4" />
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

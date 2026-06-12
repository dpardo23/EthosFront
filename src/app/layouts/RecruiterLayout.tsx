import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore, useUiStore, useNotificationsStore } from '@/store';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Avatar } from '@/shared/ui';
import { EthosCoreLogo } from '@/components/brand/EthosCoreLogo';
import { useTranslation } from 'react-i18next';

/**
 * Layout shell for recruiter dashboard pages; uses a simplified navigation without the professional sidebar.
 */
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

type NavItem = { path: string; icon: typeof LayoutDashboard; label: string };

const recruiterNavItems: NavItem[] = [
  { path: '/recruiter/dashboard',                icon: LayoutDashboard, label: 'Panel Principal' },
  { path: '/recruiter/talent-discovery',         icon: Search,          label: 'Buscar Talento' },
  { path: '/recruiter/chat',                     icon: MessageSquare,   label: 'Chat' },
  { path: '/dashboard/reclutador/configuracion', icon: Settings,        label: 'Configuración' },
];

function TopNavIcon({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link to={item.path} aria-label={item.label}>
      <div className="group relative flex flex-col items-center">
        <motion.div
          className={cn(
            'relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200',
            isActive
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {isActive && (
            <motion.div
              layoutId="recruiter-topnav-bg"
              className="absolute inset-0 rounded-xl bg-violet-500/10 dark:bg-violet-500/20"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
          <Icon className="relative z-10 h-[18px] w-[18px]" />
        </motion.div>

        {}
        <span className="pointer-events-none absolute top-full mt-1.5 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-[200]">
          {item.label}
        </span>

        {}
        {isActive && (
          <motion.div
            layoutId="recruiter-topnav-dot"
            className="absolute -bottom-1.5 h-1 w-1 rounded-full bg-violet-500"
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          />
        )}
      </div>
    </Link>
  );
}

export function RecruiterLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout, isAuthResolved } = useAuthStore();
  const { resolvedTheme, initializeTheme } = useUiStore();
  const { addNotification } = useNotificationsStore();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const globalChatChannelRef = useRef<RealtimeChannel | null>(null);

  const isDark = resolvedTheme === 'dark';
  const pathname = location.pathname;

  
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

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  
  
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  
  
  useEffect(() => {
    if (!profile?.id || !supabase || !isAuthResolved) return;
    const sb = supabase;

    
    const token = sessionStorage.getItem('ethoshub_access_token');
    if (token) sb.realtime.setAuth(token);

    if (globalChatChannelRef.current) sb.removeChannel(globalChatChannelRef.current);

    const channel = sb
      .channel(`global-chat-rec:${profile.id}`)
      .on(
        'postgres_changes',
        
        { event: 'INSERT', schema: 'core', table: 'chat_messages', filter: `sender_id=neq.${profile.id}` },
        (payload) => {
          const msg = payload.new as { sender_id: string; content: string; chat_id: string };
          
          if (pathnameRef.current.startsWith('/recruiter/chat')) return;
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

  useEffect(() => { if (initializeTheme) initializeTheme(); }, [initializeTheme]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const topbarStyle = isDark
    ? { background: 'rgba(6,6,8,0.94)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }
    : { background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };

  const dropdownCls = cn(
    'rounded-2xl border border-border shadow-2xl',
    isDark ? 'bg-zinc-900 shadow-black/50' : 'bg-white shadow-black/15',
  );

  const fullName = profile?.name || 'Reclutador';

  return (
    <div className={cn('flex h-screen flex-col overflow-hidden', isDark ? 'bg-[#030305]' : 'bg-background')}>

      {}
      <header
        className="relative z-[60] flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4"
        style={topbarStyle}
      >
        {}
        <Link to="/recruiter/dashboard" className="flex items-center gap-2.5 shrink-0">
          <EthosCoreLogo size="sm" />
        </Link>

        {}
        <nav className="hidden md:flex items-center gap-1">
          {recruiterNavItems.map(item => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return <TopNavIcon key={item.path} item={item} isActive={isActive} />;
          })}
        </nav>

        {}
        <div className="flex items-center gap-1.5">

          {}
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

          {}
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[55] bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.nav
              className="fixed left-0 right-0 top-14 z-[56] border-b border-border md:hidden"
              style={topbarStyle}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <div className="flex flex-col p-2 gap-0.5">
                {recruiterNavItems.map(item => {
                  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {}
      <div id="portal-root" className="relative flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto bg-background">
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

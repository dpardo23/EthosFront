/**
 * ConnectionsPage.tsx — Premium v3
 * - 7-provider catalogue: GitHub, Google, Gmail, LinkedIn, Slack, Sitio Web, dev.to
 * - 2-step AddConnectionModal: catalog → configure (OAuth UI / URL input)
 * - AnimatePresence x-slide between modal steps; createPortal → #portal-root
 * - "profile" terminology throughout; never "user"
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Github,
  Linkedin,
  Globe,
  RefreshCw,
  Unplug,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Clock,
  Zap,
  Activity,
  ArrowLeft,
  Lock,
  ShieldCheck,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { cn, formatDate } from '@/shared/lib/utils';

// ─── Local types ──────────────────────────────────────────────────────────────

type LocalProvider = 'github' | 'linkedin' | 'website' | 'devto' | 'google' | 'gmail' | 'slack';
type LocalStatus   = 'connected' | 'disconnected' | 'pending';
type ApiHealth     = 'healthy' | 'degraded' | 'down';

interface LocalConnection {
  id: string;
  provider: LocalProvider;
  status: LocalStatus;
  label: string;
  username?: string;
  url?: string;
  lastSynced?: string;
  tokenExpiresAt?: string;
  apiHealth: ApiHealth;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CONNECTIONS: LocalConnection[] = [
  {
    id: 'conn-github',
    provider: 'github',
    status: 'connected',
    label: 'GitHub',
    username: 'dpardo',
    url: 'https://github.com/dpardo',
    lastSynced: '2026-05-27T10:30:00Z',
    tokenExpiresAt: '2026-11-27T10:30:00Z',
    apiHealth: 'healthy',
  },
  {
    id: 'conn-linkedin',
    provider: 'linkedin',
    status: 'connected',
    label: 'LinkedIn',
    username: 'Diego Pardo',
    url: 'https://linkedin.com/in/dpardo',
    lastSynced: '2026-05-26T14:00:00Z',
    tokenExpiresAt: '2026-08-26T14:00:00Z',
    apiHealth: 'healthy',
  },
  {
    id: 'conn-website',
    provider: 'website',
    status: 'connected',
    label: 'Sitio web',
    url: 'https://dpardo.dev',
    lastSynced: '2026-05-28T08:15:00Z',
    apiHealth: 'degraded',
  },
  {
    id: 'conn-devto',
    provider: 'devto',
    status: 'disconnected',
    label: 'dev.to',
    username: 'dpardo',
    url: 'https://dev.to/dpardo',
    apiHealth: 'down',
  },
];

// ─── SVG brand icons ──────────────────────────────────────────────────────────

function DevToIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.3zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path d="M2 6l10 7 10-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

// ─── Provider catalogue ────────────────────────────────────────────────────────

interface ProviderMeta {
  id: LocalProvider;
  label: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  isManual?: boolean;
  oauthLabel?: string;
  oauthBtnCls?: string;
  permissions?: string[];
}

const PROVIDER_CATALOGUE: ProviderMeta[] = [
  {
    id: 'github',
    label: 'GitHub',
    description: 'Actividad, repos y contribuciones',
    icon: Github,
    iconBg: 'bg-zinc-900',
    iconColor: 'text-white',
    oauthLabel: 'Autorizar con GitHub',
    oauthBtnCls: 'bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white',
    permissions: [
      'Leer repositorios públicos',
      'Ver actividad de contribuciones',
      'Acceder a estadísticas de perfil',
    ],
  },
  {
    id: 'google',
    label: 'Google',
    description: 'Identidad y servicios de Google',
    icon: GoogleIcon,
    iconBg: 'bg-white border border-border',
    iconColor: '',
    oauthLabel: 'Continuar con Google',
    oauthBtnCls: 'bg-white dark:bg-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-200 text-gray-800 border border-gray-200',
    permissions: [
      'Ver nombre y foto de perfil',
      'Acceder al email de la cuenta',
    ],
  },
  {
    id: 'gmail',
    label: 'Gmail',
    description: 'Notificaciones y correo profesional',
    icon: GmailIcon,
    iconBg: 'bg-[#EA4335]',
    iconColor: 'text-white',
    oauthLabel: 'Conectar Gmail',
    oauthBtnCls: 'bg-[#EA4335] hover:bg-[#D33828] text-white',
    permissions: [
      'Leer etiquetas del buzón',
      'Enviar notificaciones desde tu cuenta',
      'No accede al contenido de correos',
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'Perfil profesional y recomendaciones',
    icon: Linkedin,
    iconBg: 'bg-[#0A66C2]',
    iconColor: 'text-white',
    oauthLabel: 'Conectar LinkedIn',
    oauthBtnCls: 'bg-[#0A66C2] hover:bg-[#0959A8] text-white',
    permissions: [
      'Ver perfil profesional público',
      'Acceder a experiencia laboral',
      'Leer recomendaciones recibidas',
    ],
  },
  {
    id: 'slack',
    label: 'Slack',
    description: 'Notificaciones de equipos y canales',
    icon: SlackIcon,
    iconBg: 'bg-[#4A154B]',
    iconColor: 'text-white',
    oauthLabel: 'Conectar Slack',
    oauthBtnCls: 'bg-[#4A154B] hover:bg-[#3D1040] text-white',
    permissions: [
      'Leer canales y mensajes públicos',
      'Enviar notificaciones al workspace',
      'Ver información del workspace',
    ],
  },
  {
    id: 'website',
    label: 'Sitio web',
    description: 'Tu dominio personal o portfolio',
    icon: Globe,
    iconBg: 'bg-violet-600',
    iconColor: 'text-white',
    isManual: true,
  },
  {
    id: 'devto',
    label: 'dev.to',
    description: 'Artículos técnicos y actividad',
    icon: DevToIcon,
    iconBg: 'bg-zinc-900',
    iconColor: 'text-white',
    oauthLabel: 'Conectar dev.to',
    oauthBtnCls: 'bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white',
    permissions: [
      'Leer artículos publicados',
      'Acceder a estadísticas de publicaciones',
    ],
  },
];

// ─── Modal step animation ──────────────────────────────────────────────────────

const stepVariants: Variants = {
  enter: (dir: number) => ({ x: dir * 28, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 32 },
  },
  exit: (dir: number) => ({
    x: dir * -28,
    opacity: 0,
    transition: { duration: 0.12, ease: 'easeIn' },
  }),
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const { t } = useTranslation();
  const { user: profile } = useAuthStore();
  const { addToast } = useUiStore();

  const [connections, setConnections] = useState<LocalConnection[]>(MOCK_CONNECTIONS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [busyId, setBusyId]             = useState<string | null>(null);

  void t;
  void profile;

  const handleDisconnect = (id: string) => {
    setBusyId(id);
    setTimeout(() => {
      setConnections(prev =>
        prev.map(c => c.id === id ? { ...c, status: 'disconnected', apiHealth: 'down' } : c)
      );
      setBusyId(null);
      addToast({ type: 'success', title: 'Conexión desconectada' });
    }, 700);
  };

  const handleReconnect = (id: string) => {
    setBusyId(id);
    setTimeout(() => {
      setConnections(prev =>
        prev.map(c =>
          c.id === id
            ? { ...c, status: 'connected', apiHealth: 'healthy', lastSynced: new Date().toISOString() }
            : c
        )
      );
      setBusyId(null);
      addToast({ type: 'success', title: 'Conexión restablecida' });
    }, 900);
  };

  const handleAddConnection = (provider: LocalProvider, url?: string) => {
    const meta = PROVIDER_CATALOGUE.find(p => p.id === provider)!;
    if (connections.some(c => c.provider === provider)) {
      addToast({ type: 'error', title: `${meta.label} ya está conectado` });
      return;
    }
    const newConn: LocalConnection = {
      id: `conn-${provider}-${Date.now()}`,
      provider,
      status: 'pending',
      label: meta.label,
      url,
      lastSynced: undefined,
      apiHealth: 'healthy',
    };
    setConnections(prev => [...prev, newConn]);
    setShowAddModal(false);
    addToast({ type: 'success', title: `${meta.label} añadido` });
    setTimeout(() => {
      setConnections(prev =>
        prev.map(c =>
          c.id === newConn.id
            ? { ...c, status: 'connected', lastSynced: new Date().toISOString() }
            : c
        )
      );
    }, 1200);
  };

  const connected    = connections.filter(c => c.status === 'connected');
  const disconnected = connections.filter(c => c.status !== 'connected');

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6 pb-8"
    >
      {/* ── Header card ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-6 sm:px-8 sm:py-7">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,_hsl(var(--primary)/0.12)_0%,_transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_100%_100%,_hsl(var(--primary)/0.06)_0%,_transparent_100%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5 max-w-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <LinkIcon className="h-3 w-3 text-primary" />
              Integraciones de Red
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Conexiones.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gestiona tus integraciones y enriquece tu portafolio profesional.
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Agregar conexión
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            {[
              { label: 'Total',     value: connections.length,                                         icon: Activity,    color: 'text-foreground'       },
              { label: 'Activas',   value: connected.length,                                           icon: CheckCircle2, color: 'text-emerald-500'     },
              { label: 'Inactivas', value: disconnected.length,                                        icon: XCircle,     color: 'text-muted-foreground' },
              { label: 'API OK',    value: connections.filter(c => c.apiHealth === 'healthy').length,  icon: Zap,         color: 'text-violet-500'       },
            ].map(({ label, value, icon: Icon, color }) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="w-[88px] rounded-2xl border border-border bg-background/80 px-3 py-2.5 text-center backdrop-blur"
              >
                <Icon className={cn('h-3 w-3 mx-auto mb-1', color)} />
                <p className="text-lg font-bold text-foreground tabular-nums leading-none">{value}</p>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Active connections ───────────────────────────────────────────────── */}
      {connected.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Activas · {connected.length}
            </span>
          </div>
          <motion.div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
            }}
          >
            {connected.map(conn => (
              <motion.div
                key={conn.id}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.97 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } },
                }}
              >
                <ConnectionCard
                  connection={conn}
                  busy={busyId === conn.id}
                  onReconnect={() => handleReconnect(conn.id)}
                  onDisconnect={() => handleDisconnect(conn.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ── Inactive / pending ───────────────────────────────────────────────── */}
      {disconnected.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/50">
              <XCircle className="h-3 w-3 text-muted-foreground/60" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Inactivas · {disconnected.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {disconnected.map((conn, i) => (
              <motion.div
                key={conn.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 28 }}
              >
                <ConnectionCard
                  connection={conn}
                  busy={busyId === conn.id}
                  onReconnect={() => handleReconnect(conn.id)}
                  onDisconnect={() => handleDisconnect(conn.id)}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {connections.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/50">
            <Activity className="h-7 w-7 text-muted-foreground/30" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Sin conexiones activas</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
            Conecta tus plataformas para enriquecer tu portafolio profesional.
          </p>
          <Button onClick={() => setShowAddModal(true)} className="mt-5 gap-2">
            <Plus className="h-4 w-4" />
            Agregar primera conexión
          </Button>
        </div>
      )}

      {/* ── Add connection modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <AddConnectionModal
            existingProviders={connections.map(c => c.provider)}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddConnection}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── ConnectionCard ────────────────────────────────────────────────────────────

function ConnectionCard({
  connection,
  busy,
  onReconnect,
  onDisconnect,
}: {
  connection: LocalConnection;
  busy: boolean;
  onReconnect: () => void;
  onDisconnect: () => void;
}) {
  const meta      = getProviderMeta(connection.provider);
  const isActive  = connection.status === 'connected';
  const isPending = connection.status === 'pending';

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.008 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-shadow duration-300',
        isActive
          ? 'border-border hover:border-emerald-500/30 hover:shadow-[0_6px_24px_rgba(16,185,129,0.10)]'
          : 'border-border/70 opacity-75 hover:opacity-100',
      )}
    >
      <div className="flex items-center gap-3.5 mb-4">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', meta.iconBg)}>
          <meta.icon className={cn('h-5 w-5', meta.iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-foreground truncate">{meta.label}</p>
            <StatusDot status={connection.status} />
          </div>
          {connection.username && (
            <p className="text-[12px] text-muted-foreground truncate">@{connection.username}</p>
          )}
          {!connection.username && connection.url && (
            <p className="text-[12px] text-muted-foreground truncate">{connection.url.replace('https://', '')}</p>
          )}
        </div>
        <HealthBadge health={connection.apiHealth} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <MetaTile
          icon={Clock}
          label="Sincronizado"
          value={connection.lastSynced ? formatDate(connection.lastSynced) : '—'}
        />
        <MetaTile
          icon={Activity}
          label="API"
          value={
            connection.apiHealth === 'healthy' ? 'Operativa'
            : connection.apiHealth === 'degraded' ? 'Degradada'
            : 'Caída'
          }
        />
      </div>

      <div className="flex gap-2">
        {isActive || isPending ? (
          <button
            onClick={onDisconnect}
            disabled={busy || isPending}
            className="flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-1.5 text-[12px] font-medium text-red-500 hover:bg-red-500/15 transition-colors disabled:opacity-40"
          >
            <Unplug className="h-3 w-3" />
            {busy ? 'Procesando…' : 'Desconectar'}
          </button>
        ) : (
          <button
            onClick={onReconnect}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn('h-3 w-3', busy && 'animate-spin')} />
            {busy ? 'Reconectando…' : 'Reconectar'}
          </button>
        )}
        {connection.url && (
          <a
            href={connection.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ─── AddConnectionModal — portal contained in #portal-root ───────────────────

function AddConnectionModal({
  existingProviders,
  onClose,
  onAdd,
}: {
  existingProviders: LocalProvider[];
  onClose: () => void;
  onAdd: (provider: LocalProvider, url?: string) => void;
}) {
  const [step, setStep]         = useState<'catalog' | 'configure'>('catalog');
  const [selected, setSelected] = useState<ProviderMeta | null>(null);
  const [direction, setDirection] = useState<number>(1);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [urlError, setUrlError]     = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (step === 'configure') handleBack();
      else onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, onClose]);

  useEffect(() => {
    if (step === 'configure' && selected?.isManual) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [step, selected]);

  const handleSelectProvider = (p: ProviderMeta) => {
    setSelected(p);
    setDirection(1);
    setWebsiteUrl('');
    setUrlError(null);
    setStep('configure');
  };

  const handleBack = () => {
    setDirection(-1);
    setStep('catalog');
    setSelected(null);
    setIsConnecting(false);
  };

  const handleConnect = () => {
    if (!selected) return;
    if (selected.isManual) {
      const trimmed = websiteUrl.trim();
      if (!trimmed) { setUrlError('Ingresa una URL válida'); return; }
      if (!/^https?:\/\/.+\..+/.test(trimmed)) {
        setUrlError('Ingresa una URL válida (ej. https://tupagina.com)');
        return;
      }
      setUrlError(null);
    }
    setIsConnecting(true);
    setTimeout(() => {
      onAdd(selected.id, selected.isManual ? websiteUrl.trim() : undefined);
      setIsConnecting(false);
    }, 820);
  };

  const portalRoot = document.getElementById('portal-root') ?? document.body;

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        key="add-conn-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 z-[80] bg-background/75 backdrop-blur-md"
        onClick={step === 'configure' ? handleBack : onClose}
      />

      {/* Panel */}
      <div className="absolute inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="add-conn-panel"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-black/25 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
            <AnimatePresence mode="wait" initial={false}>
              {step === 'catalog' ? (
                <motion.div
                  key="hdr-catalog"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.14 }}
                  className="flex-1 min-w-0"
                >
                  <h2 className="text-[15px] font-semibold text-foreground">Agregar conexión</h2>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">Selecciona un proveedor</p>
                </motion.div>
              ) : (
                <motion.button
                  key="hdr-back"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.14 }}
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors flex-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Atrás
                </motion.button>
              )}
            </AnimatePresence>
            <button
              onClick={onClose}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step content */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {step === 'catalog' ? (
                <motion.div
                  key="step-catalog"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <div className="max-h-[62vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2.5 p-4">
                      {PROVIDER_CATALOGUE.map((p, i) => {
                        const isAlreadyConnected = existingProviders.includes(p.id);
                        return (
                          <motion.button
                            key={p.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, type: 'spring', stiffness: 340, damping: 28 }}
                            onClick={() => !isAlreadyConnected && handleSelectProvider(p)}
                            disabled={isAlreadyConnected}
                            className={cn(
                              'relative flex flex-col items-start gap-2.5 rounded-xl border p-3.5 text-left transition-all duration-150',
                              isAlreadyConnected
                                ? 'border-emerald-500/25 bg-emerald-500/5 opacity-60 cursor-default'
                                : 'border-border bg-muted/30 hover:border-violet-500/40 hover:bg-violet-500/5 hover:shadow-sm cursor-pointer active:scale-[0.98]',
                            )}
                          >
                            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', p.iconBg)}>
                              <p.icon className={cn('h-4 w-4', p.iconColor)} />
                            </div>
                            <div className="min-w-0 w-full">
                              <p className="text-[13px] font-semibold text-foreground truncate">{p.label}</p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{p.description}</p>
                            </div>
                            {isAlreadyConnected && (
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Activo
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="px-5 pb-4 border-t border-border/50 pt-3">
                    <p className="text-[11px] text-muted-foreground/60 text-center">
                      Las conexiones simulan autenticación OAuth en modo demo.
                    </p>
                  </div>
                </motion.div>
              ) : selected ? (
                <motion.div
                  key="step-configure"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <ConfigureStep
                    provider={selected}
                    websiteUrl={websiteUrl}
                    urlError={urlError}
                    isConnecting={isConnecting}
                    inputRef={inputRef}
                    onUrlChange={(val) => { setWebsiteUrl(val); setUrlError(null); }}
                    onConnect={handleConnect}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>,
    portalRoot,
  );
}

// ─── ConfigureStep ─────────────────────────────────────────────────────────────

function ConfigureStep({
  provider,
  websiteUrl,
  urlError,
  isConnecting,
  inputRef,
  onUrlChange,
  onConnect,
}: {
  provider: ProviderMeta;
  websiteUrl: string;
  urlError: string | null;
  isConnecting: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onUrlChange: (val: string) => void;
  onConnect: () => void;
}) {
  return (
    <div className="p-5">
      {/* Provider hero */}
      <div className="flex items-center gap-4 mb-6">
        <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm', provider.iconBg)}>
          <provider.icon className={cn('h-7 w-7', provider.iconColor)} />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-foreground">{provider.label}</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">{provider.description}</p>
        </div>
      </div>

      {provider.isManual ? (
        /* URL input */
        <div className="space-y-2 mb-6">
          <label className="text-[12px] font-semibold text-foreground/80">URL del sitio</label>
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors',
              urlError
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-border bg-muted/40 focus-within:border-violet-500/50 focus-within:bg-violet-500/5',
            )}
          >
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="url"
              placeholder="https://tupagina.com"
              value={websiteUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isConnecting && onConnect()}
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
          </div>
          <AnimatePresence>
            {urlError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.14 }}
                className="text-[11px] text-red-500"
              >
                {urlError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* OAuth permissions */
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
            Permisos solicitados
          </p>
          <div className="space-y-2">
            {(provider.permissions ?? []).map((perm) => (
              <div key={perm} className="flex items-start gap-2.5">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                <span className="text-[12px] text-foreground/80 leading-snug">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA button */}
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed',
          provider.isManual
            ? 'bg-violet-600 hover:bg-violet-500 text-white'
            : (provider.oauthBtnCls ?? 'bg-foreground hover:bg-foreground/90 text-background'),
        )}
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : provider.isManual ? (
          <LinkIcon className="h-4 w-4" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        <span>
          {isConnecting
            ? (provider.isManual ? 'Guardando…' : 'Conectando…')
            : (provider.isManual ? 'Guardar conexión' : (provider.oauthLabel ?? `Conectar ${provider.label}`))}
        </span>
      </button>

      <p className="mt-3 text-center text-[10px] text-muted-foreground/50">
        {provider.isManual
          ? 'La URL se verifica automáticamente en modo demo.'
          : 'Autenticación segura via OAuth 2.0. Tus credenciales nunca se almacenan.'}
      </p>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: LocalStatus }) {
  return (
    <span
      className={cn(
        'inline-flex h-1.5 w-1.5 rounded-full',
        status === 'connected'    && 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]',
        status === 'pending'      && 'bg-amber-400 animate-pulse',
        status === 'disconnected' && 'bg-muted-foreground/40',
      )}
    />
  );
}

function HealthBadge({ health }: { health: ApiHealth }) {
  const map = {
    healthy:  { label: 'Saludable', icon: CheckCircle2,  cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    degraded: { label: 'Degradada', icon: AlertTriangle, cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'       },
    down:     { label: 'Caída',     icon: XCircle,       cls: 'bg-red-500/10 text-red-500'                               },
  } as const;
  const { label, icon: Icon, cls } = map[health];
  return (
    <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0', cls)}>
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function MetaTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-2.5">
      <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        <Icon className="h-2.5 w-2.5" />
        {label}
      </div>
      <p className="text-[12px] font-medium text-foreground leading-snug">{value}</p>
    </div>
  );
}

// ─── Provider meta (all 7 providers) ──────────────────────────────────────────

function getProviderMeta(provider: LocalProvider): {
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
} {
  const map: Record<LocalProvider, { label: string; icon: React.ElementType; iconBg: string; iconColor: string }> = {
    github:   { label: 'GitHub',    icon: Github,      iconBg: 'bg-zinc-900',                iconColor: 'text-white' },
    google:   { label: 'Google',    icon: GoogleIcon,  iconBg: 'bg-white border border-border', iconColor: ''        },
    gmail:    { label: 'Gmail',     icon: GmailIcon,   iconBg: 'bg-[#EA4335]',               iconColor: 'text-white' },
    linkedin: { label: 'LinkedIn',  icon: Linkedin,    iconBg: 'bg-[#0A66C2]',               iconColor: 'text-white' },
    slack:    { label: 'Slack',     icon: SlackIcon,   iconBg: 'bg-[#4A154B]',               iconColor: 'text-white' },
    website:  { label: 'Sitio web', icon: Globe,       iconBg: 'bg-violet-600',              iconColor: 'text-white' },
    devto:    { label: 'dev.to',    icon: DevToIcon,   iconBg: 'bg-zinc-900',                iconColor: 'text-white' },
  };
  return map[provider];
}

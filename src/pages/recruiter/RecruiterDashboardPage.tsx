import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  ArrowRight,
  Users,
  Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { Avatar } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface KPI {
  label: string;
  value: number | string;
  icon: typeof Heart;
  color: string;
  path: string;
}

interface RecentLike {
  basic_profile_id: string;
  slug: string | null;
  full_name: string;
  photo_url: string | null;
  professional_title: string | null;
}

interface CompanyInfo {
  company_name: string | null;
  industry: string | null;
  avatar_url: string | null;
}

function KPICard({ kpi, delay }: { kpi: KPI; delay: number }) {
  const navigate = useNavigate();
  const Icon = kpi.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -3, boxShadow: '0 0 24px rgba(139,92,246,0.15)' }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(kpi.path)}
      className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-violet-500/40"
    >
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', kpi.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{kpi.label}</p>
      </div>
      <ArrowRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-violet-400" />
    </motion.button>
  );
}

const quickActions = [
  {
    label: 'Buscar Talento',
    description: 'Explora perfiles de profesionales',
    icon: Search,
    path: '/recruiter/talent-discovery',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
  {
    label: 'Mis Favoritos',
    description: 'Gestiona perfiles guardados',
    icon: Heart,
    path: '/recruiter/likes',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  {
    label: 'Chat',
    description: 'Conversaciones activas',
    icon: MessageSquare,
    path: '/recruiter/chat',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    label: 'Configuración',
    description: 'Edita tu perfil de empresa',
    icon: Settings,
    path: '/dashboard/reclutador/configuracion',
    color: 'bg-muted text-muted-foreground border-border',
  },
];

export default function RecruiterDashboardPage() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  const [likesCount, setLikesCount] = useState(0);
  const [chatsCount, setChatsCount] = useState(0);
  const [talentsExplored, setTalentsExplored] = useState(0);
  const [recentLikes, setRecentLikes] = useState<RecentLike[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id || !supabase) return;
    const sb = supabase;

    Promise.all([
      sb.rpc('get_company_likes_full', { p_company_id: profile.id }),
      sb.rpc('get_company_chats_count', { p_company_id: profile.id }),
      sb.rpc('get_company_profile', { p_id_auth: profile.id }),
      sb.rpc('get_talent_views_count', { p_company_id: profile.id }),
    ]).then(([likesRes, chatsRes, companyRes, viewsRes]) => {
      const likesRows = (likesRes.data ?? []) as any[];
      setLikesCount(likesRows.length);
      setChatsCount((chatsRes.data as number) ?? 0);
      setTalentsExplored((viewsRes.data as number) ?? 0);

      const company = (companyRes.data as any[])?.[0] ?? null;
      if (company) setCompanyInfo(company as CompanyInfo);

      const mapped: RecentLike[] = likesRows.slice(0, 4).map((r: any) => ({
        basic_profile_id: r.basic_profile_id,
        slug: r.slug ?? null,
        full_name: [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Perfil',
        photo_url: r.avatar_url ?? null,
        professional_title: null,
      }));
      setRecentLikes(mapped);
    }).finally(() => setIsLoading(false));
  }, [profile?.id]);

  const kpis: KPI[] = [
    {
      label: 'Perfiles guardados',
      value: isLoading ? '—' : likesCount,
      icon: Heart,
      color: 'bg-rose-500/10 text-rose-400',
      path: '/recruiter/likes',
    },
    {
      label: 'Chats activos',
      value: isLoading ? '—' : chatsCount,
      icon: MessageSquare,
      color: 'bg-emerald-500/10 text-emerald-400',
      path: '/recruiter/chat',
    },
    {
      label: 'Talentos explorados',
      value: isLoading ? '—' : talentsExplored,
      icon: Users,
      color: 'bg-violet-500/10 text-violet-400',
      path: '/recruiter/talent-discovery',
    },
  ];

  return (
    <div className="space-y-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2 text-violet-500">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Panel Principal</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-foreground sm:text-3xl">
            Bienvenido, {profile?.name?.split(' ')[0] ?? 'Reclutador'}
          </h1>
          {companyInfo?.company_name && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {companyInfo.company_name}
              {companyInfo.industry && <span className="opacity-50">· {companyInfo.industry}</span>}
            </p>
          )}
        </div>

        {(companyInfo?.avatar_url || companyInfo?.company_name) && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            {companyInfo.avatar_url ? (
              <img src={companyInfo.avatar_url} alt={companyInfo.company_name ?? ''} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        )}
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.label} kpi={kpi} delay={i * 0.08} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="mb-4 text-sm font-semibold text-foreground">Acciones rápidas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.path}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(action.path)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5 text-left transition-colors hover:border-violet-500/40"
                >
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', action.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Recent likes */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.36 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Guardados recientemente</h2>
            <button
              onClick={() => navigate('/recruiter/likes')}
              className="text-xs text-violet-500 hover:text-violet-400 transition-colors"
            >
              Ver todos
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-16 animate-pulse rounded bg-muted/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentLikes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no tienes perfiles guardados.
            </p>
          ) : (
            <div className="space-y-3">
              {recentLikes.map(p => (
                <motion.button
                  key={p.basic_profile_id}
                  whileHover={{ x: 2 }}
                  onClick={() => p.slug && navigate(`/p/${p.slug}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted"
                >
                  <Avatar
                    src={p.photo_url ?? undefined}
                    alt={p.full_name}
                    fallback={p.full_name}
                    className="h-9 w-9 shrink-0 rounded-full border border-border"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.full_name}</p>
                    {p.professional_title && (
                      <p className="truncate text-xs text-muted-foreground">{p.professional_title}</p>
                    )}
                  </div>
                  <Heart className="ml-auto h-3.5 w-3.5 shrink-0 fill-rose-400 text-rose-400" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

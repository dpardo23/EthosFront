import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
  Users, Folder, UserPlus, Activity, TrendingUp, ArrowUpRight, ArrowDownRight,
  Terminal, Server, Database, Zap, Clock, RefreshCw, LineChart, Code2, Cpu,
} from 'lucide-react';
import { Button, Badge, Skeleton, Tabs, EmptyState, ErrorState } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import {
  adminMetricsService,
  type AdminGlobalMetrics,
  type AdminGrowthPoint,
  type AdminRoleDistribution,
  type AdminSystemHealth,
  type AdminSystemLog,
  type AdminTopSkill,
} from '@/shared/services/adminService';

/**
 * Admin Global Metrics view fed 100% by real platform data
 * (admin.* RPCs + admin.system_logs in Supabase).
 */
const timeRanges = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
];

const ROLE_COLORS: Record<string, string> = {
  Profesionales: '#8B5CF6',
  Reclutadores: '#D8B4FE',
  Admins: '#A78BFA',
};

const LOGS_POLL_MS = 15_000;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm dark:border-violet-500/30 dark:bg-black/95">
        <p className="mb-1.5 text-xs font-medium text-violet-600 dark:text-violet-400">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function formatUptime(seconds: number | null): string {
  if (seconds == null) return '—';
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

function formatLogTime(iso: string): string {
  const date = new Date(iso.replace(' ', 'T'));
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function AdminDashboardPage() {
  const [selectedRange, setSelectedRange] = useState(30);
  const [activeTab, setActiveTab] = useState('tendencias');
  const [metrics, setMetrics] = useState<AdminGlobalMetrics | null>(null);
  const [growth, setGrowth] = useState<AdminGrowthPoint[]>([]);
  const [roles, setRoles] = useState<AdminRoleDistribution | null>(null);
  const [topSkills, setTopSkills] = useState<AdminTopSkill[]>([]);
  const [health, setHealth] = useState<AdminSystemHealth | null>(null);
  const [logs, setLogs] = useState<AdminSystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const loadAll = useCallback(async (days: number) => {
    setError(null);
    try {
      const [overview, growthSeries, roleDist, skills, healthSnap, logEntries] = await Promise.all([
        adminMetricsService.getOverview(),
        adminMetricsService.getGrowth(days),
        adminMetricsService.getRoles(),
        adminMetricsService.getTopSkills(5),
        adminMetricsService.getHealth(),
        adminMetricsService.getLogs(50),
      ]);
      setMetrics(overview);
      setGrowth(growthSeries);
      setRoles(roleDist);
      setTopSkills(skills);
      setHealth(healthSnap);
      setLogs(logEntries);
    } catch {
      setError('No se pudieron cargar las métricas. Verifica que el backend esté disponible.');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadAll(selectedRange).finally(() => setIsLoading(false));
  }, [loadAll, selectedRange]);

  useEffect(() => {
    const interval = setInterval(() => {
      adminMetricsService.getLogs(50).then(setLogs).catch(() => undefined);
    }, LOGS_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAll(selectedRange);
    setIsRefreshing(false);
  };

  const growthChartData = useMemo(
    () =>
      growth.map((point) => ({
        date: new Date(`${point.day}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        total: point.cumulativeTotal,
        nuevos: point.newProfessionals + point.newRecruiters,
      })),
    [growth],
  );

  const roleChartData = useMemo(() => {
    if (!roles) return [];
    return [
      { name: 'Profesionales', value: roles.professionals },
      { name: 'Reclutadores', value: roles.recruiters },
      { name: 'Admins', value: roles.admins },
    ].filter((entry) => entry.value > 0);
  }, [roles]);

  const newDelta = metrics ? metrics.newProfiles24h - metrics.newProfilesPrev24h : 0;
  const healthIsOk =
    health != null &&
    (health.cacheHitRatio == null || health.cacheHitRatio >= 90) &&
    (health.avgQueryTimeMs == null || health.avgQueryTimeMs < 100);

  const kpiStats = metrics
    ? [
        {
          label: 'Total de Profiles',
          value: metrics.totalProfiles.toLocaleString(),
          badge: `+${metrics.newProfiles30d} en 30d`,
          trend: 'up' as const,
          icon: Users,
          description: `${metrics.professionalProfiles} profesionales · ${metrics.recruiterProfiles} reclutadores`,
        },
        {
          label: 'Portafolios Activos',
          value: metrics.activePortfolios.toLocaleString(),
          badge: `${metrics.totalPortfolios} totales`,
          trend: 'up' as const,
          icon: Folder,
          description: 'Publicados por profiles profesionales',
        },
        {
          label: 'Nuevos Profiles (24h)',
          value: metrics.newProfiles24h.toLocaleString(),
          badge: `${newDelta >= 0 ? '+' : ''}${newDelta} vs ayer`,
          trend: newDelta >= 0 ? ('up' as const) : ('down' as const),
          icon: UserPlus,
          description: 'Registros en las últimas 24 horas',
        },
        {
          label: 'Salud del Sistema',
          value: health?.cacheHitRatio != null ? `${health.cacheHitRatio}%` : '—',
          badge: healthIsOk ? 'Óptimo' : 'Revisar',
          trend: healthIsOk ? ('up' as const) : ('down' as const),
          icon: Activity,
          description: `Cache hit · query media ${health?.avgQueryTimeMs ?? '—'} ms`,
        },
      ]
    : [];

  if (error && !metrics) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <ErrorState title="Error al cargar métricas" message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className="flex h-full max-w-full flex-col gap-4 overflow-x-hidden p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
            Métricas Globales
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Datos en vivo de la plataforma EthosHub
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-gray-200 bg-transparent text-violet-600 hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white p-1 sm:flex-none dark:border-white/10 dark:bg-zinc-950">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedRange(range.value)}
                className={cn(
                  'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:flex-none sm:px-3',
                  selectedRange === range.value
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                    : 'text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white',
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && kpiStats.length === 0
          ? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 w-full rounded-xl" />)
          : kpiStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.35 }}
              >
                <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-violet-500/40 dark:border-white/10 dark:bg-zinc-950">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl transition-all group-hover:bg-violet-500/20 dark:bg-violet-500/20" />
                  <div className="relative flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25">
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'border-0 text-xs',
                        stat.trend === 'up'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
                      )}
                    >
                      {stat.trend === 'up' ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                      {stat.badge}
                    </Badge>
                  </div>
                  <div className="relative mt-3">
                    <p className="font-sans text-2xl font-bold text-black dark:text-white md:text-3xl">{stat.value}</p>
                    <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{stat.label}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

      <div className="flex items-center justify-between">
        <Tabs
          tabs={[
            { id: 'tendencias', label: 'Tendencias', icon: <LineChart className="h-4 w-4" /> },
            { id: 'skills', label: 'Top Skills', icon: <Code2 className="h-4 w-4" /> },
            { id: 'sistema', label: 'Sistema y Logs', icon: <Terminal className="h-4 w-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === 'tendencias' && (
          <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2 dark:border-white/10 dark:bg-zinc-950">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-sans text-base font-semibold text-black dark:text-white">Crecimiento de Profiles</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Últimos {selectedRange} días · core.profiles_basic + core.profiles_company</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-600" /> Acumulado
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-300" /> Nuevos/día
                  </span>
                </div>
              </div>
              <div className="h-64 md:h-72">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthChartData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorNuevos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D8B4FE" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#D8B4FE" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" strokeOpacity={0.2} />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorTotal)" name="Total acumulado" />
                      <Area type="monotone" dataKey="nuevos" stroke="#D8B4FE" strokeWidth={2} fill="url(#colorNuevos)" name="Nuevos por día" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
              <div className="mb-3">
                <h2 className="font-sans text-base font-semibold text-black dark:text-white">Distribución por Rol</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Profiles activos por tipo</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-64 w-full rounded-lg" />
              ) : roleChartData.length === 0 ? (
                <EmptyState title="Sin profiles" description="Todavía no hay profiles registrados." />
              ) : (
                <>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roleChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                          {roleChartData.map((entry) => (
                            <Cell key={entry.name} fill={ROLE_COLORS[entry.name]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-2">
                    {roleChartData.map((role) => {
                      const total = roleChartData.reduce((sum, entry) => sum + entry.value, 0);
                      const percentage = total === 0 ? '0.0' : ((role.value / total) * 100).toFixed(1);
                      return (
                        <div key={role.name} className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[role.name] }} />
                            {role.name}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-black dark:text-white">{role.value.toLocaleString()}</span>
                            <span className="text-gray-500 dark:text-gray-400">({percentage}%)</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-sans text-base font-semibold text-black dark:text-white">Top 5 Skills</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Más recurrentes en portafolios publicados</p>
              </div>
              <Badge variant="secondary" className="border-0 bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                Datos reales
              </Badge>
            </div>
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : topSkills.length === 0 ? (
              <EmptyState
                title="Sin skills en portafolios activos"
                description="Cuando los profiles profesionales publiquen portafolios con skills, aparecerán aquí."
              />
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSkills} layout="vertical" barCategoryGap="22%">
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#D8B4FE" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" strokeOpacity={0.2} horizontal={false} />
                      <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" stroke="#a78bfa" fontSize={12} tickLine={false} axisLine={false} width={110} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="profileCount" fill="url(#barGradient)" radius={[0, 6, 6, 0]} name="Profiles" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {topSkills.map((skill) => (
                    <span
                      key={skill.tagId}
                      className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs dark:border-violet-500/20 dark:bg-violet-500/10"
                    >
                      <span className="text-violet-700 dark:text-violet-300">{skill.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">{skill.profileCount}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'sistema' && (
          <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
              <div className="mb-3">
                <h2 className="font-sans text-base font-semibold text-black dark:text-white">Salud del Motor</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PostgreSQL {health?.postgresVersion ?? ''} · pg_stat_statements
                </p>
              </div>
              {isLoading || !health ? (
                <Skeleton className="h-64 w-full rounded-lg" />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { name: 'Base de datos', icon: Database, value: health.databaseSizeMb != null ? `${health.databaseSizeMb} MB` : '—', sub: 'Tamaño total' },
                    { name: 'Conexiones', icon: Server, value: `${health.totalConnections ?? '—'}/${health.maxConnections ?? '—'}`, sub: `${health.activeConnections ?? 0} activas` },
                    { name: 'Cache hit', icon: Zap, value: health.cacheHitRatio != null ? `${health.cacheHitRatio}%` : '—', sub: 'pg_stat_database' },
                    { name: 'Query media', icon: Cpu, value: health.avgQueryTimeMs != null ? `${health.avgQueryTimeMs} ms` : '—', sub: `${health.totalQueries?.toLocaleString() ?? 0} queries` },
                    { name: 'Uptime', icon: Clock, value: formatUptime(health.uptimeSeconds), sub: 'Desde reinicio' },
                    { name: 'Transacciones', icon: Activity, value: health.commits?.toLocaleString() ?? '—', sub: `${health.rollbacks?.toLocaleString() ?? 0} rollbacks` },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-center transition-all hover:border-violet-300 dark:border-white/10 dark:bg-black/60 dark:hover:border-violet-500/40"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20">
                        <item.icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <p className="font-sans text-sm font-bold text-black dark:text-white">{item.value}</p>
                      <div>
                        <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{item.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20">
                    <Terminal className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className="font-sans text-base font-semibold text-black dark:text-white">System Logs</h2>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">admin.system_logs · eventos reales</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">LIVE</span>
                </div>
              </div>
              <div
                ref={logContainerRef}
                className="h-64 flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-[11px] dark:border-white/5 dark:bg-black"
              >
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded" />
                ) : logs.length === 0 ? (
                  <p className="text-gray-400 dark:text-violet-500/40">Sin eventos registrados todavía…</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="mb-1.5 flex items-start gap-2 leading-relaxed">
                      <span className="shrink-0 text-gray-400 dark:text-violet-500/60">[{formatLogTime(log.createdAt)}]</span>
                      <span
                        className={cn(
                          log.severity === 'info' && 'text-blue-600 dark:text-violet-300',
                          log.severity === 'success' && 'text-emerald-600 dark:text-emerald-400',
                          log.severity === 'warning' && 'text-amber-600 dark:text-amber-400',
                          log.severity === 'error' && 'text-red-600 dark:text-red-400',
                        )}
                      >
                        [{log.eventType}] {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

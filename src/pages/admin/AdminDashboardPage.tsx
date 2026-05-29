import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
  Users, Folder, UserPlus, Activity, TrendingUp, ArrowUpRight, ArrowDownRight,
  Terminal, Server, Database, Globe, Zap, Clock, RefreshCw,
} from 'lucide-react';
import { Button, Card, Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

// Time range options
const timeRanges = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
];

// KPI Stats with dynamic values
const getKpiStats = () => [
  {
    label: 'Total Usuarios',
    value: '12,847',
    change: '+12.5%',
    trend: 'up' as const,
    icon: Users,
    description: 'core.users',
  },
  {
    label: 'Portafolios Activos',
    value: '8,234',
    change: '+8.2%',
    trend: 'up' as const,
    icon: Folder,
    description: 'core.profiles',
  },
  {
    label: 'Nuevos (24h)',
    value: '156',
    change: '+24.3%',
    trend: 'up' as const,
    icon: UserPlus,
    description: 'Ultimas 24 horas',
  },
  {
    label: 'Salud Sistema',
    value: '99.9%',
    change: '+0.1%',
    trend: 'up' as const,
    icon: Activity,
    description: 'Uptime global',
  },
];

// User growth data generator
const generateGrowthData = (days: number) => {
  const data = [];
  const baseUsers = 10000;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      usuarios: Math.floor(baseUsers + (days - i) * 95 + Math.random() * 50),
      activos: Math.floor((baseUsers + (days - i) * 95) * 0.75 + Math.random() * 30),
    });
  }
  return data;
};

// Role distribution data (core_types.rol_ethoshub)
const roleDistribution = [
  { name: 'Estandar', value: 9850, color: '#8B5CF6' },
  { name: 'Reclutador', value: 2847, color: '#D8B4FE' },
  { name: 'Admin', value: 150, color: '#A78BFA' },
];

// Top skills data (from portfolio.skills)
const topSkills = [
  { name: 'React', count: 4523, growth: '+12%' },
  { name: 'TypeScript', count: 3987, growth: '+18%' },
  { name: 'Python', count: 3654, growth: '+8%' },
  { name: 'Node.js', count: 3421, growth: '+5%' },
  { name: 'AWS', count: 2987, growth: '+22%' },
];

// System logs mock (admin.system_logs)
const systemLogMessages = [
  { type: 'info', message: '[AUTH] Usuario profesional@ethoshub.com inicio sesion', timestamp: '' },
  { type: 'success', message: '[PORTFOLIO] Nuevo portafolio creado por @anamartinez', timestamp: '' },
  { type: 'info', message: '[SKILL] Skill "GraphQL" agregado por 3 usuarios', timestamp: '' },
  { type: 'warning', message: '[RATE_LIMIT] IP 192.168.1.45 alcanzo limite de requests', timestamp: '' },
  { type: 'success', message: '[PROJECT] Proyecto "E-commerce App" publicado', timestamp: '' },
  { type: 'info', message: '[SEARCH] Query "React developer Madrid" ejecutada', timestamp: '' },
  { type: 'error', message: '[DB] Conexion timeout - reconectando...', timestamp: '' },
  { type: 'success', message: '[DB] Conexion restablecida exitosamente', timestamp: '' },
  { type: 'info', message: '[AUTH] Usuario reclutador@ethoshub.com inicio sesion', timestamp: '' },
  { type: 'success', message: '[MATCH] 5 candidatos encontrados para vacante #1234', timestamp: '' },
  { type: 'warning', message: '[SECURITY] Intento de login fallido detectado', timestamp: '' },
  { type: 'info', message: '[ANALYTICS] Reporte semanal generado', timestamp: '' },
];

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-violet-500/30 bg-white/95 dark:bg-black/95 px-3 py-2 shadow-xl backdrop-blur-sm sm:px-4 sm:py-3">
        <p className="mb-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 sm:mb-2 sm:text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs sm:text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const [selectedRange, setSelectedRange] = useState(30);
  const [growthData, setGrowthData] = useState(generateGrowthData(30));
  const [logs, setLogs] = useState<typeof systemLogMessages>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const kpiStats = getKpiStats();

  // Update growth data when range changes
  useEffect(() => {
    setGrowthData(generateGrowthData(selectedRange));
  }, [selectedRange]);

  // Simulate live system logs
  useEffect(() => {
    const interval = setInterval(() => {
      const randomLog = systemLogMessages[Math.floor(Math.random() * systemLogMessages.length)];
      const timestamp = new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      setLogs(prev => [...prev.slice(-29), { 
        ...randomLog, 
        timestamp,
        message: randomLog.message 
      }]);
    }, 2500);

    // Initial logs
    const now = new Date();
    setLogs(systemLogMessages.slice(0, 8).map((log, i) => ({
      ...log,
      timestamp: new Date(now.getTime() - i * 3000).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    })));

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setGrowthData(generateGrowthData(selectedRange));
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="max-w-full space-y-4 overflow-x-hidden bg-gray-50 dark:bg-black p-4 md:space-y-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
            Metricas Globales
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 md:text-base">Centro de control de EthosHub</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-gray-200 dark:border-violet-500/30 bg-transparent text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-1 sm:flex-none">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedRange(range.value)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all sm:flex-none sm:px-3 sm:text-sm",
                  selectedRange === range.value
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                    : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats - Bento Grid */}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {kpiStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-4 transition-all hover:border-violet-500/40 md:p-6">
              {/* Lilac glow effect (only visible in dark mode typically, but kept subtle) */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-3xl transition-all group-hover:bg-violet-500/20 dark:group-hover:bg-violet-500/30" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-2xl" />
              
              <div className="relative flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25 md:h-12 md:w-12">
                  <stat.icon className="h-5 w-5 text-white md:h-6 md:w-6" />
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "border-0 text-xs",
                    stat.trend === 'up' 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" 
                      : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                  )}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  )}
                  {stat.change}
                </Badge>
              </div>
              <div className="relative mt-3 md:mt-4">
                <p className="font-sans text-2xl font-bold text-black dark:text-white md:text-3xl">{stat.value}</p>
                <p className="text-sm font-medium text-violet-600 dark:text-violet-400">{stat.label}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid w-full grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        {/* User Growth Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-6">
              <div>
                <h2 className="font-sans text-base font-semibold text-black dark:text-white md:text-lg">Crecimiento de Usuarios</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 md:text-sm">Ultimos {selectedRange} dias</p>
              </div>
              <div className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-violet-600 shadow-sm shadow-violet-500/50 sm:h-3 sm:w-3" />
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-purple-300 shadow-sm shadow-purple-300/50 sm:h-3 sm:w-3" />
                  <span className="text-gray-600 dark:text-gray-400">Activos</span>
                </div>
              </div>
            </div>
            <div className="h-64 sm:h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                      <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorActivos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D8B4FE" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#D8B4FE" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#D8B4FE" stopOpacity={0} />
                    </linearGradient>
                    {/* Glow filter */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="usuarios"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsuarios)"
                    name="Total Usuarios"
                    filter="url(#glow)"
                  />
                  <Area
                    type="monotone"
                    dataKey="activos"
                    stroke="#D8B4FE"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActivos)"
                    name="Usuarios Activos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Role Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="h-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-4 md:p-6">
            <div className="mb-4">
              <h2 className="font-sans text-base font-semibold text-black dark:text-white md:text-lg">Distribucion por Rol</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 md:text-sm">core_types.rol_ethoshub</p>
            </div>
            <div className="h-44 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="pieGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    filter="url(#pieGlow)"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-4 space-y-2">
              {roleDistribution.map((role) => {
                const total = roleDistribution.reduce((sum, r) => sum + r.value, 0);
                const percentage = ((role.value / total) * 100).toFixed(1);
                return (
                  <div key={role.name} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2.5 w-2.5 rounded-full shadow-sm sm:h-3 sm:w-3" 
                        style={{ backgroundColor: role.color, boxShadow: `0 0 8px ${role.color}50` }} 
                      />
                      <span className="text-gray-600 dark:text-gray-400">{role.name}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="font-medium text-black dark:text-white">{role.value.toLocaleString()}</span>
                      <span className="text-gray-500 dark:text-gray-400">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid w-full grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        {/* Top Skills Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-4 md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:mb-6">
              <div>
                <h2 className="font-sans text-base font-semibold text-black dark:text-white md:text-lg">Top 5 Skills</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 md:text-sm">Habilidades mas agregadas en la plataforma</p>
              </div>
              <Badge variant="secondary" className="w-fit border-0 bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                En crecimiento
              </Badge>
            </div>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSkills} layout="vertical" barCategoryGap="20%">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#D8B4FE" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" strokeOpacity={0.2} horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#a78bfa" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    fill="url(#barGradient)" 
                    radius={[0, 6, 6, 0]}
                    name="Usuarios"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Growth indicators */}
            <div className="mt-3 flex flex-wrap gap-1.5 md:mt-4 md:gap-2">
              {topSkills.map((skill) => (
                <div 
                  key={skill.name}
                  className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs dark:border-violet-500/20 dark:bg-violet-500/10"
                >
                  <span className="text-violet-700 dark:text-violet-300">{skill.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{skill.growth}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Live System Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 sm:h-10 sm:w-10 dark:from-violet-500/20 dark:to-purple-500/20">
                  <Terminal className="h-4 w-4 text-violet-600 dark:text-violet-400 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h2 className="font-sans text-base font-semibold text-black dark:text-white md:text-lg">System Logs</h2>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">admin.system_logs</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 sm:gap-2 sm:px-3 sm:py-1 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 sm:text-xs">LIVE</span>
              </div>
            </div>
            <div 
              ref={logContainerRef}
              className="h-56 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-[10px] scrollbar-hide sm:h-72 sm:p-4 sm:text-xs dark:border-white/5 dark:bg-black"
              style={{ scrollBehavior: 'smooth' }}
            >
              <AnimatePresence mode="popLayout">
                {logs.map((log, index) => (
                  <motion.div
                    key={`${index}-${log.timestamp}`}
                    initial={{ opacity: 0, x: -10, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'mb-1.5 flex items-start gap-2 leading-relaxed',
                    )}
                  >
                    <span className="shrink-0 text-gray-400 dark:text-violet-500/60">[{log.timestamp}]</span>
                    <span className={cn(
                      log.type === 'info' && 'text-blue-600 dark:text-violet-300',
                      log.type === 'success' && 'text-emerald-600 dark:text-emerald-400',
                      log.type === 'warning' && 'text-amber-600 dark:text-amber-400',
                      log.type === 'error' && 'text-red-600 dark:text-red-400'
                    )}>
                      {log.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="mt-2 flex items-center gap-1">
                <span className="animate-pulse text-violet-600 dark:text-violet-500">_</span>
                <span className="text-gray-400 dark:text-violet-500/40">Esperando logs...</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Health Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:mb-6">
            <div>
              <h2 className="font-sans text-base font-semibold text-black dark:text-white md:text-lg">Estado del Sistema</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 md:text-sm">Monitoreo en tiempo real</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Ultima actualizacion:</span> hace 5s
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              { name: 'API Server', icon: Server, status: 'healthy', latency: '45ms', uptime: '99.99%' },
              { name: 'Database', icon: Database, status: 'healthy', latency: '12ms', uptime: '99.95%' },
              { name: 'CDN', icon: Globe, status: 'healthy', latency: '8ms', uptime: '100%' },
              { name: 'Auth Service', icon: Zap, status: 'healthy', latency: '23ms', uptime: '99.98%' },
            ].map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3 transition-all hover:border-violet-300 dark:border-white/10 dark:bg-black/60 dark:hover:border-violet-500/40 sm:gap-3 sm:p-5"
              >
                {/* Animated background pulse */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 transition-all group-hover:from-violet-200 group-hover:to-purple-200 dark:from-violet-500/20 dark:to-purple-500/20 dark:group-hover:from-violet-500/30 dark:group-hover:to-purple-500/30 sm:h-14 sm:w-14">
                    <service.icon className="h-5 w-5 text-violet-600 dark:text-violet-400 sm:h-7 sm:w-7" />
                  </div>
                  {/* Status indicator */}
                  <span className="absolute -right-1 -top-1 flex h-3 w-3 sm:h-4 sm:w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 sm:h-4 sm:w-4">
                      <span className="h-1 w-1 rounded-full bg-white sm:h-1.5 sm:w-1.5" />
                    </span>
                  </span>
                </div>
                <div className="relative text-center">
                  <p className="font-sans text-xs font-medium text-black dark:text-white sm:text-sm">{service.name}</p>
                  <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] sm:mt-1 sm:gap-2 sm:text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400">{service.latency}</span>
                    <span className="text-violet-300 dark:text-violet-500">|</span>
                    <span className="text-gray-500 dark:text-gray-400">{service.uptime}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

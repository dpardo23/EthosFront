import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Eye,
  Flag,
  FolderKanban,
  Globe2,
  Image as ImageIcon,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

type RiskLevel = 'Alto' | 'Medio' | 'Bajo';
type PortfolioStatus = 'Publicado' | 'En revision' | 'Observado';

const summaryStats = [
  {
    label: 'Portafolios activos',
    value: '2,184',
    detail: '+46 esta semana',
    icon: Briefcase,
    accent: 'from-sky-500/20 to-cyan-500/10',
  },
  {
    label: 'En revision manual',
    value: '27',
    detail: '9 con prioridad alta',
    icon: Flag,
    accent: 'from-amber-500/20 to-orange-500/10',
  },
  {
    label: 'Publicados hoy',
    value: '58',
    detail: '92% sin observaciones',
    icon: CheckCircle2,
    accent: 'from-emerald-500/20 to-green-500/10',
  },
  {
    label: 'Visibilidad global',
    value: '81%',
    detail: 'Indexacion saludable',
    icon: Globe2,
    accent: 'from-fuchsia-500/20 to-pink-500/10',
  },
];

const featuredPortfolios: {
  name: string;
  role: string;
  status: PortfolioStatus;
  views: string;
  completion: number;
  note: string;
  tags: string[];
}[] = [
  {
    name: 'Lucia Herrera',
    role: 'Product Designer',
    status: 'Publicado',
    views: '12.8k vistas',
    completion: 96,
    note: 'Caso destacado con narrativa clara, proyectos consistentes y buena densidad visual.',
    tags: ['UI Systems', 'Research', 'Case Study'],
  },
  {
    name: 'Marco Alvarez',
    role: 'Full Stack Engineer',
    status: 'En revision',
    views: '8.1k vistas',
    completion: 88,
    note: 'Buen nivel tecnico; se revisa la coherencia entre experiencia declarada y demos enlazadas.',
    tags: ['APIs', 'Cloud', 'Performance'],
  },
  {
    name: 'Nadia Costa',
    role: 'Brand Strategist',
    status: 'Observado',
    views: '5.4k vistas',
    completion: 79,
    note: 'Necesita ajustar claims de resultados y sumar creditos mas claros en proyectos colaborativos.',
    tags: ['Branding', 'Campaigns', 'Storytelling'],
  },
];

const moderationQueue: {
  title: string;
  owner: string;
  trigger: string;
  risk: RiskLevel;
  due: string;
}[] = [
  {
    title: 'Portfolio de Sofia Mendez',
    owner: 'sofia.mendez',
    trigger: 'Capturas sin contexto en proyecto principal',
    risk: 'Medio',
    due: 'Hoy, 13:20',
  },
  {
    title: 'Portfolio de Bruno Lima',
    owner: 'bruno.lima',
    trigger: 'Posible duplicacion de piezas visuales',
    risk: 'Alto',
    due: 'Hoy, 15:10',
  },
  {
    title: 'Portfolio de Carla Rios',
    owner: 'carla.rios',
    trigger: 'Metadata incompleta para SEO publico',
    risk: 'Bajo',
    due: 'Manana, 10:00',
  },
];

const healthSignals = [
  { label: 'Cobertura de portada y avatar', value: 93, note: 'La mayoria ya tiene identidad visual completa.' },
  { label: 'Proyectos con evidencia verificable', value: 82, note: 'Faltan links o capturas en algunos perfiles nuevos.' },
  { label: 'Calidad de copy profesional', value: 87, note: 'Buenos titulares, pero 14 bios siguen muy genericas.' },
  { label: 'Riesgo reputacional controlado', value: 95, note: 'Solo 4 casos escalados a observacion fuerte.' },
];

const activityFeed = [
  {
    title: 'Revision automatica superada',
    text: 'Tres portafolios nuevos quedaron visibles tras validar links, portada y estructura minima.',
    icon: ShieldCheck,
    tone: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    title: 'Observacion editorial',
    text: 'Se marco una bio por claims demasiado amplios sin evidencia en proyectos relacionados.',
    icon: AlertTriangle,
    tone: 'bg-amber-500/10 text-amber-500',
  },
  {
    title: 'Ajuste visual recomendado',
    text: 'Se detectaron miniaturas recortadas en portfolios mobile y quedaron en seguimiento.',
    icon: ImageIcon,
    tone: 'bg-sky-500/10 text-sky-500',
  },
  {
    title: 'Nueva regla activa',
    text: 'Ahora se solicita al menos un proyecto anclado para perfiles con visibilidad publica.',
    icon: Wand2,
    tone: 'bg-violet-500/10 text-violet-500',
  },
];

const statusClassNames: Record<PortfolioStatus, string> = {
  Publicado: 'bg-emerald-500/10 text-emerald-500',
  'En revision': 'bg-amber-500/10 text-amber-500',
  Observado: 'bg-rose-500/10 text-rose-500',
};

const riskClassNames: Record<RiskLevel, string> = {
  Alto: 'bg-rose-500/10 text-rose-500',
  Medio: 'bg-amber-500/10 text-amber-500',
  Bajo: 'bg-sky-500/10 text-sky-500',
};

export default function AdminPortfoliosPage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_30%),radial-gradient(circle_at_80%_15%,_rgba(59,130,246,0.16),_transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.05),transparent_60%)]" />
          <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
            <div className="max-w-2xl">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-500">
                <Sparkles className="mr-1 h-3 w-3" />
                Centro de Moderacion
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                Moderacion de Portafolios
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Dejé esta vista con contenido estatico para que el area admin ya tenga contexto
                visual: estado del ecosistema, cola de revision, portfolios destacados y señales
                rapidas de calidad antes de conectar datos reales.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Casos escalados
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">06</p>
                <p className="mt-1 text-sm text-muted-foreground">requieren criterio editorial</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Vistas moderadas
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">94k</p>
                <p className="mt-1 text-sm text-muted-foreground">impacto semanal estimado</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Ultimo corte
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">10:18</p>
                <p className="mt-1 text-sm text-muted-foreground">snapshot visual de ejemplo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="relative overflow-hidden p-0">
              <div className={cn('absolute inset-x-0 top-0 h-24 bg-gradient-to-br', item.accent)} />
              <div className="relative p-6">
                <div className="flex items-start justify-between">
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    {item.detail}
                  </span>
                </div>
                <p className="mt-8 text-3xl font-bold text-foreground">{item.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="p-6">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Portafolios destacados</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ejemplos estaticos para representar distintos estados de publicacion.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm">
                <Layers3 className="h-4 w-4" />
                Colecciones
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
                Previsualizar
              </Button>
              <Button size="sm">
                <FolderKanban className="h-4 w-4" />
                Nueva revision
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {featuredPortfolios.map((portfolio) => (
              <div
                key={portfolio.name}
                className="rounded-2xl border border-border bg-background/60 p-5 transition-colors hover:bg-background"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{portfolio.name}</h3>
                      <Badge variant="secondary" className={statusClassNames[portfolio.status]}>
                        {portfolio.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-primary">{portfolio.role}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{portfolio.note}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {portfolio.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-w-[220px] gap-3 rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completitud</span>
                      <span className="font-medium text-foreground">{portfolio.completion}%</span>
                    </div>
                    <Progress value={portfolio.completion} />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Alcance</span>
                      <span className="font-medium text-foreground">{portfolio.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Actividad reciente</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Eventos mock para darle movimiento a la pagina.
              </p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-5 space-y-4">
            {activityFeed.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-2xl border border-border p-4">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', item.tone)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Cola de revision</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Casos simulados con disparadores frecuentes de moderacion.
              </p>
            </div>
            <Badge variant="outline" className="text-foreground">
              3 pendientes
            </Badge>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1.2fr_0.8fr_1.2fr_0.8fr] gap-3 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span>Portfolio</span>
              <span>Usuario</span>
              <span>Trigger</span>
              <span>Due</span>
            </div>
            {moderationQueue.map((item) => (
              <div
                key={item.title}
                className="grid grid-cols-1 gap-3 border-t border-border px-4 py-4 text-sm sm:grid-cols-[1.2fr_0.8fr_1.2fr_0.8fr]"
              >
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <Badge variant="secondary" className={riskClassNames[item.risk]}>
                    {item.risk}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{item.owner}</p>
                <p className="text-muted-foreground">{item.trigger}</p>
                <p className="text-foreground">{item.due}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Salud editorial</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Indicadores rapidos para lectura ejecutiva.
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-5 space-y-5">
            {healthSignals.map((signal) => (
              <div key={signal.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{signal.label}</span>
                  <span className="text-muted-foreground">{signal.value}%</span>
                </div>
                <Progress value={signal.value} />
                <p className="text-xs text-muted-foreground">{signal.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

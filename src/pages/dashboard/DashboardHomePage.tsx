import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import {
  MapPin, Briefcase, GraduationCap, FolderKanban, Code2,
  ExternalLink, Calendar, Building2, Star, Sparkles, ArrowRight,
  TrendingUp, Eye, MousePointerClick, GitBranch, Zap,
  CheckCircle2, AlertCircle, CircleDot, ChevronRight,
  Globe, Activity, Award,
} from 'lucide-react';
import { useAuthStore, useProjectsStore, useUiStore } from '@/store';
import { Avatar } from '@/shared/ui';
import RecruiterTalentSearchPage from './RecruiterTalentSearchPage';
import {
  dashboardService,
  type ProfessionalDashboardData,
  type DashboardExperience,
  type DashboardEducation,
  type DashboardSkill,
} from '@/shared/services/dashboardService';
import type { Project } from '@/shared/types';
import { cn } from '@/shared/lib/utils';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatPeriod(start: string, end: string | null, isCurrent: boolean) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
  return `${fmt(start)} – ${isCurrent || !end ? 'Actualidad' : fmt(end)}`;
}

function calcDuration(start: string, end: string | null, isCurrent: boolean): string {
  const from = new Date(start + 'T00:00:00');
  const to = isCurrent || !end ? new Date() : new Date(end + 'T00:00:00');
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (months < 1) return '< 1 mes';
  if (months < 12) return `${months} mes${months > 1 ? 'es' : ''}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} año${y > 1 ? 's' : ''} ${m} mes${m > 1 ? 'es' : ''}` : `${y} año${y > 1 ? 's' : ''}`;
}

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  draft:       { label: 'Borrador',    color: 'text-zinc-400',   dot: 'bg-zinc-500' },
  in_progress: { label: 'En progreso', color: 'text-amber-400',  dot: 'bg-amber-400' },
  completed:   { label: 'Completado',  color: 'text-emerald-400', dot: 'bg-emerald-400' },
  archived:    { label: 'Archivado',   color: 'text-zinc-500',   dot: 'bg-zinc-600' },
};

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 30 });
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    return spring.on('change', (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toLocaleString('es-ES') + suffix;
    });
  }, [spring, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  change,
  color,
  delay = 0,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  suffix?: string;
  change?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 25 }}
      className="group relative rounded-2xl border border-border bg-card p-4 overflow-hidden hover:border-violet-500/20 transition-all duration-300"
    >
      {/* Ambient glow */}
      <div className={cn('absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity', color)} />

      <div className="relative z-10">
        <div className={cn('mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl', color.replace('bg-', 'bg-').replace('500', '500/15'))}>
          <Icon className={cn('h-4 w-4', color.replace('bg-', 'text-'))} />
        </div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          <AnimatedCounter value={value} suffix={suffix} />
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        {change && (
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{change} este mes</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── AI Recommendation ─────────────────────────────────────────────────────────

function AIRec({
  icon: Icon,
  text,
  href,
  priority,
  delay = 0,
}: {
  icon: typeof Zap;
  text: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
  delay?: number;
}) {
  const colors = {
    high:   { bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: 'text-violet-500 dark:text-violet-400', badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-300' },
    medium: { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: 'text-amber-500 dark:text-amber-400',  badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300' },
    low:    { bg: 'bg-muted/50',      border: 'border-border',        icon: 'text-muted-foreground',               badge: 'bg-muted text-muted-foreground' },
  }[priority];

  const labels = { high: 'Alta', medium: 'Media', low: 'Baja' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', stiffness: 250, damping: 28 }}
    >
      <Link
        to={href}
        className={cn(
          'flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 hover:brightness-105 group',
          colors.bg, colors.border
        )}
      >
        <div className={cn('shrink-0', colors.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="flex-1 text-sm text-foreground leading-snug">{text}</p>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', colors.badge)}>
            {labels[priority]}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  href,
  hrefLabel = 'Gestionar',
  children,
  delay = 0,
}: {
  title: string;
  icon: typeof Briefcase;
  href: string;
  hrefLabel?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 28 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-violet-500 dark:text-violet-400" />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <Link
          to={href}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-violet-500 transition-colors group"
        >
          {hrefLabel}
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
      <div className="px-5 py-4">{children}</div>
    </motion.div>
  );
}

// ── Experience item ───────────────────────────────────────────────────────────

function ExperienceItem({ exp, index }: { exp: DashboardExperience; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex gap-4 pb-5 last:pb-0"
    >
      {/* Timeline line */}
      <div className="absolute left-5 top-10 bottom-0 w-px bg-gradient-to-b from-violet-500/20 to-transparent last-of-type:hidden" />

      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
        {exp.logo_url ? (
          <img src={exp.logo_url} alt={exp.company_name} className="h-6 w-6 rounded-lg object-contain" />
        ) : (
          <Building2 className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1 pt-1.5">
        <p className="text-sm font-semibold text-foreground">{exp.job_title}</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">{exp.company_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatPeriod(exp.start_date, exp.end_date, exp.is_current)}
          </span>
          <span className="text-[11px] text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground/50">{calcDuration(exp.start_date, exp.end_date, exp.is_current)}</span>
          {exp.is_current && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <CircleDot className="h-2.5 w-2.5" />
              Actual
            </span>
          )}
        </div>
        {exp.description && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{exp.description}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Education item ────────────────────────────────────────────────────────────

function EducationItem({ edu, index }: { edu: DashboardEducation; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, type: 'spring', stiffness: 300, damping: 30 }}
      className="flex gap-4 py-3 border-b border-white/[0.04] last:border-0"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{edu.degree_title}</p>
        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">{edu.institution_name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground">{formatPeriod(edu.start_date, edu.end_date, edu.in_progress)}</span>
          {edu.in_progress && (
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">En curso</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Skill tag ─────────────────────────────────────────────────────────────────

function SkillTag({ skill, index }: { skill: DashboardSkill; index: number }) {
  const levelColors: Record<string, string> = {
    Junior: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Mid:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Senior: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  };
  const levelClass = skill.seniority ? (levelColors[skill.seniority] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20') : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.03 * index, type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 hover:border-violet-500/20 hover:bg-violet-500/5 transition-all duration-200 group"
    >
      <div className="flex items-center gap-2">
        {skill.icon_url ? (
          <img src={skill.icon_url} alt={skill.name} className="h-4 w-4 object-contain" />
        ) : (
          <Code2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
        )}
        <span className="text-sm font-medium text-foreground">{skill.name}</span>
      </div>
      {skill.seniority && (
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', levelClass)}>
          {skill.seniority}
        </span>
      )}
    </motion.div>
  );
}

// ── Featured project card ─────────────────────────────────────────────────────

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const status = STATUS_MAP[project.status] ?? STATUS_MAP.draft;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, type: 'spring', stiffness: 200, damping: 25 }}
    >
      <Link to={`/dashboard/projects/${project.id}`} className="group block">
        <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden hover:border-violet-500/20 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]">
          {/* Thumbnail */}
          <div className="relative h-32 bg-muted/40">
            {project.thumbnail ? (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <FolderKanban className="h-10 w-10 text-muted-foreground/30" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Featured badge */}
            {project.isFeatured && (
              <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                <Star className="h-3 w-3 fill-white" />
                Destacado
              </div>
            )}

            {/* Status */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              <span className={cn('text-[11px] font-medium', status.color)}>{status.label}</span>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 space-y-2 bg-card">
            <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-violet-500 transition-colors">
              {project.title}
            </p>
            {project.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
            )}
            {project.technicalInfo?.technologies?.length ? (
              <div className="flex flex-wrap gap-1">
                {project.technicalInfo.technologies.slice(0, 4).map((tech) => (
                  <span key={tech} className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {tech}
                  </span>
                ))}
                {project.technicalInfo.technologies.length > 4 && (
                  <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
                    +{project.technicalInfo.technologies.length - 4}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Profile completion ────────────────────────────────────────────────────────

function ProfileCompletion({
  data,
  projectCount,
}: {
  data: ProfessionalDashboardData;
  projectCount: number;
}) {
  const checks = [
    { label: 'Foto de perfil',    done: !!data.basic_info.photo_url },
    { label: 'Título profesional', done: !!data.basic_info.professional_title },
    { label: 'Biografía',          done: !!data.bio_headline },
    { label: 'Habilidades',        done: data.hard_skills.length > 0 },
    { label: 'Experiencia',        done: data.experience.length > 0 },
    { label: 'Proyectos',          done: projectCount > 0 },
  ];
  const pct = Math.round((checks.filter(c => c.done).length / checks.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Completado</span>
        <span className="text-sm font-bold text-violet-400">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            )}
            <span className={cn('text-[11px]', c.done ? 'text-muted-foreground' : 'text-muted-foreground/50')}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="h-52 w-full rounded-2xl bg-muted/50 animate-pulse" />
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[0,1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />)}
        </div>
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-40 rounded-2xl bg-muted/50 animate-pulse" />)}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardHomePage() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectsStore();
  const { resolvedTheme } = useUiStore();
  const isDark = resolvedTheme === 'dark';

  const [data, setData] = useState<ProfessionalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (user?.role === 'recruiter') return <RecruiterTalentSearchPage />;

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      dashboardService.getProfessionalDashboard(user.id),
      fetchProjects(user.profile_id || user.id),
    ])
      .then(([d]) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-zinc-600 mx-auto" />
          <p className="text-sm text-zinc-500">No se pudo cargar el dashboard.</p>
          <button onClick={() => window.location.reload()} className="text-xs text-violet-400 hover:underline">
            Recargar
          </button>
        </div>
      </div>
    );
  }

  const { basic_info, projects_count, bio_headline, hard_skills, soft_skills, experience, education } = data;
  const fullName = `${basic_info.first_name} ${basic_info.last_name}`.trim();
  const avatarUrl = basic_info.photo_url || user?.avatar;
  const featuredProjects = projects.filter((p) => p.isFeatured);
  const allProjects = projects;

  // Build AI recommendations
  const recs: Array<{ icon: typeof Zap; text: string; href: string; priority: 'high' | 'medium' | 'low' }> = [];
  if (!basic_info.photo_url) recs.push({ icon: AlertCircle, text: 'Agrega una foto de perfil para aumentar visibilidad', href: '/dashboard/preferences', priority: 'high' });
  if (!bio_headline) recs.push({ icon: Sparkles, text: 'Escribe una biografía que destaque tu expertise', href: '/dashboard/preferences', priority: 'high' });
  if (hard_skills.length < 5) recs.push({ icon: Code2, text: 'Agrega más habilidades técnicas para mejorar tu match con recruiters', href: '/dashboard/skills', priority: 'medium' });
  if (projects_count === 0) recs.push({ icon: FolderKanban, text: 'Crea tu primer proyecto para mostrar tu portafolio', href: '/dashboard/projects', priority: 'high' });
  if (experience.length === 0) recs.push({ icon: Briefcase, text: 'Agrega tu experiencia laboral para fortalecer tu perfil', href: '/dashboard/experience', priority: 'medium' });
  if (recs.length === 0) recs.push({ icon: Award, text: 'Tu perfil está en buen estado. ¡Conéctalo a GitHub para más visibilidad!', href: '/dashboard/connections', priority: 'low' });

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          className="relative rounded-2xl border border-border overflow-hidden"
        >
          {/* Banner */}
          <div
            className="h-36 sm:h-44 w-full relative"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #1a0533 0%, #0d0218 40%, #0a0a14 60%, #0c0824 100%)'
                : 'linear-gradient(135deg, #f5f0ff 0%, #ede9fe 50%, #e8e0ff 100%)',
            }}
          >
            {/* Decorative orbs */}
            <div className="absolute top-4 left-1/4 h-32 w-32 rounded-full bg-violet-600/15 blur-3xl" />
            <div className="absolute top-2 right-1/3 h-24 w-24 rounded-full bg-violet-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Profile info */}
          <div className="px-5 sm:px-8 pb-6 bg-card">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14">
              {/* Avatar */}
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-lg scale-110" />
                  <Avatar
                    src={avatarUrl}
                    name={fullName}
                    size="xl"
                    className="relative ring-4 ring-card rounded-2xl"
                  />
                  {/* Online indicator */}
                  <div className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-card shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                </div>

                <div className="pb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{fullName}</h1>
                  {basic_info.professional_title && (
                    <p className="text-sm text-muted-foreground mt-0.5">{basic_info.professional_title}</p>
                  )}
                  {basic_info.country_name && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-1">
                      <MapPin className="h-3 w-3" />
                      {basic_info.country_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pb-1">
                {user?.slug && (
                  <Link
                    to={`/p/${user.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/5 transition-all duration-200"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Ver portafolio
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
                <Link
                  to="/dashboard/preferences"
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                >
                  Editar perfil
                </Link>
              </div>
            </div>

            {/* Bio */}
            {bio_headline && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl border-t border-border pt-4">
                {bio_headline}
              </p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-border">
              {[
                { label: 'Skills',       value: hard_skills.length + soft_skills.length, icon: Code2 },
                { label: 'Proyectos',    value: projects_count,                           icon: FolderKanban },
                { label: 'Experiencias', value: experience.length,                        icon: Briefcase },
                { label: 'Educación',    value: education.length,                         icon: GraduationCap },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-violet-500/70" />
                  <span className="text-lg font-bold text-foreground">{s.value}</span>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Metrics ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard icon={Eye}             label="Visitas al perfil"     value={0}   suffix=""  color="bg-violet-500" delay={0.05} />
          <MetricCard icon={MousePointerClick} label="Interacciones"       value={0}   suffix=""  color="bg-blue-500"   delay={0.1}  />
          <MetricCard icon={FolderKanban}    label="Proyectos publicados"  value={allProjects.filter(p => p.isPublic).length} color="bg-emerald-500" delay={0.15} />
          <MetricCard icon={GitBranch}       label="Habilidades técnicas"  value={hard_skills.length} color="bg-amber-500" delay={0.2} />
        </div>

        {/* ── Main grid ────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Left column */}
          <div className="space-y-5">

            {/* AI Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 28 }}
              className="rounded-2xl border border-violet-500/20 bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-violet-500/15">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Recomendaciones IA</h2>
                    <p className="text-[11px] text-muted-foreground">Optimiza tu perfil para más visibilidad</p>
                  </div>
                </div>
                <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400">
                  {recs.length} sugerencias
                </span>
              </div>
              <div className="px-5 py-4 space-y-2">
                {recs.map((rec, i) => (
                  <AIRec key={i} {...rec} delay={0.05 * i} />
                ))}
              </div>
            </motion.div>

            {/* Experience */}
            <Section title="Experiencia" icon={Briefcase} href="/dashboard/experience" delay={0.25}>
              {experience.length === 0 ? (
                <div className="py-6 text-center">
                  <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin experiencia registrada.</p>
                  <Link to="/dashboard/experience" className="mt-2 inline-block text-xs text-violet-500 hover:underline">
                    Agregar experiencia
                  </Link>
                </div>
              ) : (
                <div className="space-y-0">
                  {experience.map((exp, i) => (
                    <ExperienceItem key={exp.work_experience_id} exp={exp} index={i} />
                  ))}
                </div>
              )}
            </Section>

            {/* Education */}
            <Section title="Educación" icon={GraduationCap} href="/dashboard/education" delay={0.3}>
              {education.length === 0 ? (
                <div className="py-6 text-center">
                  <GraduationCap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin educación registrada.</p>
                  <Link to="/dashboard/education" className="mt-2 inline-block text-xs text-violet-500 hover:underline">
                    Agregar formación
                  </Link>
                </div>
              ) : (
                <div>
                  {education.map((edu, i) => (
                    <EducationItem key={edu.academic_record_id} edu={edu} index={i} />
                  ))}
                </div>
              )}
            </Section>

            {/* Featured Projects */}
            {featuredProjects.length > 0 && (
              <Section title="Proyectos destacados" icon={Star} href="/dashboard/projects" hrefLabel="Ver todos" delay={0.35}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {featuredProjects.map((p, i) => (
                    <ProjectCard key={p.id} project={p} index={i} />
                  ))}
                </div>
              </Section>
            )}

            {/* All projects if no featured */}
            {featuredProjects.length === 0 && allProjects.length > 0 && (
              <Section title="Proyectos" icon={FolderKanban} href="/dashboard/projects" hrefLabel="Ver todos" delay={0.35}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {allProjects.slice(0, 4).map((p, i) => (
                    <ProjectCard key={p.id} project={p} index={i} />
                  ))}
                </div>
              </Section>
            )}

            {/* Empty projects CTA */}
            {allProjects.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 28 }}
                className="rounded-2xl border border-dashed border-border p-8 text-center"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
                  <FolderKanban className="h-6 w-6 text-violet-500 dark:text-violet-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Sin proyectos aún</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                  Los proyectos son lo más importante de tu portafolio. Crea tu primer case study técnico.
                </p>
                <Link
                  to="/dashboard/projects"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Crear primer proyecto
                </Link>
              </motion.div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Profile completion */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, type: 'spring', stiffness: 200, damping: 28 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <Activity className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                <h2 className="text-sm font-semibold text-foreground">Completitud del perfil</h2>
              </div>
              <ProfileCompletion data={data} projectCount={projects_count} />
            </motion.div>

            {/* Hard Skills */}
            {hard_skills.length > 0 && (
              <Section title="Habilidades técnicas" icon={Code2} href="/dashboard/skills" hrefLabel="Gestionar" delay={0.28}>
                <div className="space-y-1.5">
                  {hard_skills.slice(0, 8).map((skill, i) => (
                    <SkillTag key={skill.skill_id} skill={skill} index={i} />
                  ))}
                  {hard_skills.length > 8 && (
                    <Link to="/dashboard/skills" className="flex items-center justify-center gap-1 pt-2 text-xs text-muted-foreground hover:text-violet-500 transition-colors">
                      Ver {hard_skills.length - 8} más <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </Section>
            )}

            {/* Soft Skills */}
            {soft_skills.length > 0 && (
              <Section title="Habilidades blandas" icon={Sparkles} href="/dashboard/skills" hrefLabel="Gestionar" delay={0.33}>
                <div className="flex flex-wrap gap-1.5">
                  {soft_skills.map((skill) => (
                    <motion.span
                      key={skill.skill_id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="rounded-xl border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:border-violet-500/25 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/5 transition-all cursor-default"
                    >
                      {skill.name}
                    </motion.span>
                  ))}
                </div>
              </Section>
            )}

            {/* Quick links */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, type: 'spring', stiffness: 200, damping: 28 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Accesos rápidos</h2>
              </div>
              <div className="p-2">
                {[
                  { to: '/dashboard/projects',    icon: FolderKanban, label: 'Gestionar proyectos' },
                  { to: '/dashboard/skills',      icon: Code2,        label: 'Editar habilidades' },
                  { to: '/dashboard/connections', icon: GitBranch,    label: 'Conectar GitHub' },
                  { to: '/dashboard/visibility',  icon: Eye,          label: 'Configurar visibilidad' },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150 group"
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground/60 group-hover:text-violet-500 transition-colors" />
                    {link.label}
                    <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

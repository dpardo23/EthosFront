import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Pencil, MapPin, Mail, Github, Globe,
  Code2, Briefcase, GraduationCap, FolderKanban,
  Building2, Calendar, CircleDot, ChevronRight,
  FileText, Download, ExternalLink, Plus,
  SplitSquareHorizontal, Star,
} from 'lucide-react';
import { useAuthStore, useProjectsStore, useUiStore } from '@/store';
import { Avatar } from '@/shared/ui';
import {
  dashboardService,
  type ProfessionalDashboardData,
  type DashboardSkill,
} from '@/shared/services/dashboardService';
import type { Project } from '@/shared/types';
import { cn } from '@/shared/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
}

function fmtPeriod(start: string, end: string | null, isCurrent: boolean) {
  return `${fmt(start)} – ${isCurrent || !end ? 'Actualidad' : fmt(end)}`;
}

// ── Mock Data (exported for reuse in PublicPortfolioPage) ──────────────────────

export const PORTFOLIO_MOCK_DASHBOARD: ProfessionalDashboardData = {
  basic_info: {
    first_name: 'Alex',
    last_name: 'Ramírez',
    professional_title: 'Senior Frontend Engineer',
    photo_url: null,
    country_name: 'Colombia',
  },
  projects_count: 2,
  bio_headline:
    'Construyo interfaces de alta calidad con React y TypeScript. Apasionado por la accesibilidad, el rendimiento web y las micro-interacciones que enamoran a los usuarios.',
  hard_skills: [
    { skill_id: 's1', name: 'React',      icon_url: null, seniority: 'Senior', years_using: 4 },
    { skill_id: 's2', name: 'TypeScript', icon_url: null, seniority: 'Senior', years_using: 3 },
    { skill_id: 's3', name: 'Tailwind',   icon_url: null, seniority: 'Mid',    years_using: 2 },
    { skill_id: 's4', name: 'Node.js',    icon_url: null, seniority: 'Mid',    years_using: 2 },
    { skill_id: 's5', name: 'PostgreSQL', icon_url: null, seniority: 'Junior', years_using: 1 },
  ],
  soft_skills: [
    { skill_id: 'ss1', name: 'Liderazgo técnico',     icon_url: null },
    { skill_id: 'ss2', name: 'Comunicación asertiva', icon_url: null },
    { skill_id: 'ss3', name: 'Problem Solving',       icon_url: null },
  ],
  experience: [
    {
      work_experience_id: 'e1',
      company_name: 'Mercado Libre',
      job_title: 'Senior Frontend Engineer',
      description:
        'Lideré la migración de Angular a React para el catálogo de productos, reduciendo el tiempo de carga un 45%. Implementé un design system desde cero adoptado por 12 equipos.',
      is_current: true,
      start_date: '2022-06-01',
      end_date: null,
      logo_url: null,
    },
    {
      work_experience_id: 'e2',
      company_name: 'Rappi',
      job_title: 'Frontend Engineer',
      description:
        'Desarrollé la landing de onboarding para restaurantes, aumentando la tasa de conversión un 32%.',
      is_current: false,
      start_date: '2020-03-01',
      end_date: '2022-05-31',
      logo_url: null,
    },
  ],
  education: [
    {
      academic_record_id: 'ed1',
      institution_name: 'Universidad de los Andes',
      degree_title: 'Ingeniería de Sistemas y Computación',
      start_date: '2016-01-01',
      end_date: '2021-12-01',
      in_progress: false,
    },
  ],
};

export const PORTFOLIO_MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    userId: 'mock',
    title: 'EthosHub — Design System',
    description:
      'Sistema de diseño completo con más de 60 componentes accesibles construido con Radix UI y Tailwind CSS.',
    category: 'Web',
    status: 'completed',
    isPublic: true,
    isFeatured: true,
    technicalInfo: {
      role: 'Lead Frontend',
      technologies: ['React', 'TypeScript', 'Tailwind', 'Storybook'],
      startDate: '2023-06-01',
      results: 'Adoptado por 5 equipos en producción.',
    },
    media: [],
    files: [],
    createdAt: '2023-06-01',
    updatedAt: '2024-01-15',
  },
  {
    id: 'p2',
    userId: 'mock',
    title: 'Dashboard de Analytics',
    description: 'Dashboard de métricas en tiempo real con gráficos D3 y WebSockets.',
    category: 'Web',
    status: 'in_progress',
    isPublic: true,
    isFeatured: false,
    technicalInfo: {
      role: 'Full Stack',
      technologies: ['Next.js', 'D3.js', 'WebSockets', 'Redis'],
      startDate: '2024-03-01',
      results: '',
    },
    media: [],
    files: [],
    createdAt: '2024-03-01',
    updatedAt: '2024-05-20',
  },
];

// ── Animation Variants ─────────────────────────────────────────────────────────

const bentoContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const bentoItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 220, damping: 28 },
  },
};

// ── Commit Heatmap ─────────────────────────────────────────────────────────────

function CommitHeatmap() {
  const seed = 42;
  const pseudo = (w: number, d: number) => ((w * 7 + d + seed) * 2654435761) >>> 0;
  const WEEKS = 20;
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => (pseudo(w, d) % 16 < 5 ? 0 : (pseudo(w, d) % 4) + 1))
  );
  const levels = ['bg-muted/40', 'bg-violet-500/20', 'bg-violet-500/42', 'bg-violet-500/68', 'bg-violet-500'];
  return (
    <div className="flex gap-[3.5px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3.5px]">
          {week.map((level, di) => (
            <div key={di} className={cn('h-[11px] w-[11px] rounded-[2.5px]', levels[level])} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Bento Card ─────────────────────────────────────────────────────────────────

function BentoCard({
  children,
  className,
  editHref,
  isEmpty = false,
  isPublicView = false,
}: {
  children: React.ReactNode;
  className?: string;
  editHref: string;
  isEmpty?: boolean;
  isPublicView?: boolean;
}) {
  return (
    <motion.div
      variants={bentoItem}
      layout
      whileHover={{
        scale: 1.01,
        y: -4,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      className={cn(
        'group relative rounded-2xl border bg-card overflow-hidden',
        isEmpty
          ? 'border-dashed border-border/70'
          : 'border-border hover:border-violet-500/25 hover:shadow-[0_0_24px_rgba(139,92,246,0.07)]',
        className
      )}
    >
      {!isPublicView && (
        <Link
          to={editHref}
          className={cn(
            'absolute top-3 right-3 z-20 flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-violet-500/40 hover:text-violet-500 hover:bg-violet-500/5',
            isEmpty ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
          onClick={(e) => e.stopPropagation()}
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      )}
      {children}
    </motion.div>
  );
}

// ── Skill Pill ─────────────────────────────────────────────────────────────────

const LEVEL_PILL: Record<string, string> = {
  Junior: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  Mid:    'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  Senior: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400',
};

function SkillPill({ skill, index }: { skill: DashboardSkill; index: number }) {
  const cls = skill.seniority
    ? (LEVEL_PILL[skill.seniority] ?? 'bg-muted/60 border-border text-muted-foreground')
    : 'bg-muted/60 border-border text-muted-foreground';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.04 * index, type: 'spring', stiffness: 420, damping: 30 }}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', cls)}
    >
      {skill.icon_url ? (
        <img src={skill.icon_url} alt={skill.name} className="h-3.5 w-3.5 object-contain" />
      ) : (
        <Code2 className="h-3 w-3 opacity-60" />
      )}
      {skill.name}
      {skill.seniority && <span className="opacity-55">· {skill.seniority}</span>}
    </motion.div>
  );
}

// ── Mini Project Card ──────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, { dot: string; label: string }> = {
  draft:       { dot: 'bg-zinc-400',    label: 'Borrador' },
  in_progress: { dot: 'bg-amber-400',   label: 'En progreso' },
  completed:   { dot: 'bg-emerald-400', label: 'Completado' },
  archived:    { dot: 'bg-zinc-600',    label: 'Archivado' },
};

function MiniProjectCard({
  project,
  index,
  isPublicView,
}: {
  project: Project;
  index: number;
  isPublicView: boolean;
}) {
  const status = STATUS_DOT[project.status] ?? STATUS_DOT.draft;
  const inner = (
    <>
      {project.thumbnail ? (
        <div className="relative h-24 overflow-hidden rounded-t-xl">
          <img
            src={project.thumbnail}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {project.isFeatured && (
            <span className="absolute top-2 left-2 flex items-center gap-0.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              <Star className="h-2.5 w-2.5 fill-white" />Destacado
            </span>
          )}
        </div>
      ) : (
        <div className="relative flex h-16 items-center justify-center rounded-t-xl bg-muted/40 border-b border-border">
          {project.isFeatured && (
            <span className="absolute top-2 left-2 flex items-center gap-0.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              <Star className="h-2.5 w-2.5 fill-white" />Destacado
            </span>
          )}
          <FolderKanban className="h-7 w-7 text-muted-foreground/30" />
        </div>
      )}
      <div className="px-3 py-2.5 space-y-1">
        <p className="text-xs font-semibold text-foreground line-clamp-1 group-hover/card:text-violet-600 dark:group-hover/card:text-violet-400 transition-colors">
          {project.title}
        </p>
        <div className="flex items-center gap-1">
          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
          <span className="text-[10px] text-muted-foreground">{status.label}</span>
        </div>
        {project.technicalInfo?.technologies?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {project.technicalInfo.technologies.slice(0, 3).map((t) => (
              <span key={t} className="rounded bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t}
              </span>
            ))}
            {project.technicalInfo.technologies.length > 3 && (
              <span className="rounded bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
                +{project.technicalInfo.technologies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index, type: 'spring', stiffness: 260, damping: 26 }}
    >
      {isPublicView ? (
        <div className="group/card overflow-hidden rounded-xl border border-border bg-background">
          {inner}
        </div>
      ) : (
        <Link
          to={`/dashboard/projects/${project.id}`}
          className="group/card block overflow-hidden rounded-xl border border-border bg-background hover:border-violet-500/25 hover:bg-violet-500/[0.03] transition-all duration-200"
        >
          {inner}
        </Link>
      )}
    </motion.div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  href,
}: {
  icon: typeof Briefcase;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-7 px-4 text-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/40">
        <Icon className="h-5 w-5 text-muted-foreground/35" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">{description}</p>
      </div>
      <Link
        to={href}
        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        {cta}
      </Link>
    </div>
  );
}

// ── Card Header ────────────────────────────────────────────────────────────────

function CardHeader({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  count,
  moreHref,
}: {
  icon: typeof Code2;
  iconBg: string;
  iconColor: string;
  title: string;
  count?: number;
  moreHref?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg border', iconBg)}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {typeof count === 'number' && count > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {moreHref && typeof count === 'number' && count > 1 && (
        <Link
          to={moreHref}
          className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-violet-500 transition-colors"
        >
          Ver más <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function PortfolioSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="h-64 w-full rounded-2xl bg-muted/40 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-52 rounded-2xl bg-muted/40 animate-pulse',
              i === 2 || i === 4 ? 'lg:col-span-2' : ''
            )}
          />
        ))}
        <div className="h-24 rounded-2xl bg-muted/40 animate-pulse md:col-span-2 lg:col-span-3" />
      </div>
    </div>
  );
}

// ── Portfolio Bento View ───────────────────────────────────────────────────────
// Named export — reused in PublicPortfolioPage with isPublicView={true}

export interface PortfolioBentoViewProps {
  data: ProfessionalDashboardData;
  projects: Project[];
  isPublicView?: boolean;
  profileEmail?: string;
  profileWebsite?: string;
  profileSlug?: string;
  profileGithub?: string;
}

export function PortfolioBentoView({
  data,
  projects,
  isPublicView = false,
  profileEmail,
  profileWebsite,
  profileSlug,
  profileGithub,
}: PortfolioBentoViewProps) {
  const { resolvedTheme } = useUiStore();
  const isDark = resolvedTheme === 'dark';

  const { basic_info, bio_headline, hard_skills, soft_skills, experience, education } = data;
  const fullName = `${basic_info.first_name} ${basic_info.last_name}`.trim();
  const avatarUrl = basic_info.photo_url ?? undefined;
  const topSkills = isPublicView ? hard_skills : hard_skills.slice(0, 3);
  const latestExp = experience[0] ?? null;
  const latestEdu = education[0] ?? null;
  const featuredProjects = projects.filter((p) => p.isFeatured).slice(0, 2);
  const displayProjects = isPublicView
    ? projects.filter((p) => p.isPublic !== false)
    : (featuredProjects.length > 0 ? featuredProjects : projects.slice(0, 2));

  return (
    <div className="space-y-5">

      {/* ── HERO CARD ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:border-violet-500/25 hover:shadow-[0_0_32px_rgba(139,92,246,0.07)] transition-colors duration-300"
      >
        {!isPublicView && (
          <Link
            to="/dashboard/preferences"
            className="absolute top-4 right-4 z-30 flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all duration-200 hover:border-violet-500/40 hover:text-violet-500"
            title="Editar datos del perfil"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        )}

        {/* Banner */}
        <div
          className="h-36 sm:h-44 w-full relative overflow-hidden"
          style={{
            background: isDark
              ? 'linear-gradient(135deg,#4c1d95 0%,#2d1264 45%,#1e1035 100%)'
              : 'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 55%,#ddd6fe 100%)',
          }}
        >
          <div className="absolute top-6 left-1/4 h-40 w-40 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute top-2 right-1/4 h-32 w-32 rounded-full bg-violet-400/20 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(168,85,247,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.5) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent" />
        </div>

        {/* Profile content: Left (avatar + info + bio + links) + Right (heatmap) */}
        <div className="px-6 sm:px-8 pb-6 -mt-14 bg-card relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">

            {/* LEFT */}
            <div className="flex-1 min-w-0">
              <div className="flex items-end gap-4 mb-4">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-lg scale-110" />
                  <Avatar
                    src={avatarUrl}
                    name={fullName}
                    size="xl"
                    className="relative ring-4 ring-card rounded-2xl"
                  />
                  <div className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-card shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                </div>
                <div className="pb-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {fullName || 'Mi Portafolio'}
                  </h1>
                  {profileGithub && (
                    <a
                      href={`https://github.com/${profileGithub.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-violet-500 transition-colors mt-0.5"
                    >
                      <Github className="h-3 w-3" />
                      {profileGithub.startsWith('@') ? profileGithub : `@${profileGithub}`}
                    </a>
                  )}
                  {basic_info.professional_title && (
                    <p className="text-sm text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                      {basic_info.professional_title}
                    </p>
                  )}
                  {basic_info.country_name && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {basic_info.country_name}
                    </p>
                  )}
                </div>
              </div>

              {bio_headline && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mb-4">
                  {bio_headline}
                </p>
              )}

              {/* Quick links — dashboard only */}
              {!isPublicView && (
                <div className="flex items-center gap-2 flex-wrap">
                  {profileEmail && (
                    <a
                      href={`mailto:${profileEmail}`}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/5 transition-all duration-200"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Gmail
                    </a>
                  )}
                  {profileWebsite && (
                    <a
                      href={profileWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/5 transition-all duration-200"
                    >
                      <Github className="h-3.5 w-3.5" />
                      GitHub
                    </a>
                  )}
                  {profileSlug && (
                    <Link
                      to={`/p/${profileSlug}`}
                      target="_blank"
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/5 transition-all duration-200"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Portfolio
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Commit heatmap — bottom-aligned with left column */}
            <div className="shrink-0 pb-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                Actividad de commits
              </p>
              <CommitHeatmap />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── BENTO GRID ────────────────────────────────────────────────────── */}
      {/*
        Layout (lg / 3-col):
          [Skills·1]    [Experience·2]
          [Education·1] [Projects·2]
          [CV Studio·3]              ← full width, zero gap
      */}
      <motion.div
        variants={bentoContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 grid-flow-dense"
      >

        {/* A) TOP SKILLS */}
        {(!isPublicView || topSkills.length > 0) && (
          <BentoCard
            editHref="/dashboard/skills"
            isEmpty={!isPublicView && topSkills.length === 0}
            isPublicView={isPublicView}
          >
            <div className="p-5">
              <CardHeader
                icon={Code2}
                iconBg="bg-violet-500/10 border-violet-500/20"
                iconColor="text-violet-500 dark:text-violet-400"
                title="Top Habilidades"
                count={hard_skills.length}
                moreHref={isPublicView ? undefined : '/dashboard/skills'}
              />
              {topSkills.length === 0 ? (
                <EmptyState
                  icon={Code2}
                  title="Sin habilidades aún"
                  description="Agrega tus skills técnicas y destácalas en tu portafolio."
                  cta="Añadir habilidad"
                  href="/dashboard/skills"
                />
              ) : (
                <div
                  className={cn(
                    isPublicView
                      ? 'overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-track]:transparent'
                      : 'overflow-hidden'
                  )}
                  style={
                    isPublicView
                      ? { maxHeight: '240px', scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }
                      : (!isPublicView && hard_skills.length > 3)
                        ? {
                            maxHeight: '180px',
                            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                          }
                        : undefined
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {topSkills.map((skill, i) => (
                      <SkillPill key={skill.skill_id} skill={skill} index={i} />
                    ))}
                  </div>
                  {soft_skills.length > 0 && (
                    <div className="pt-3 border-t border-border mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                        Blandas
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(isPublicView ? soft_skills : soft_skills.slice(0, 4)).map((s) => (
                          <span
                            key={s.skill_id}
                            className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {s.name}
                          </span>
                        ))}
                        {!isPublicView && soft_skills.length > 4 && (
                          <span className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-[11px] text-muted-foreground/60">
                            +{soft_skills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </BentoCard>
        )}

        {/* B) EXPERIENCE */}
        {(!isPublicView || latestExp !== null) && (
          <BentoCard
            editHref="/dashboard/experience"
            isEmpty={!isPublicView && latestExp === null}
            className="md:col-span-1 lg:col-span-2"
            isPublicView={isPublicView}
          >
            <div className="p-5">
              <CardHeader
                icon={Briefcase}
                iconBg="bg-blue-500/10 border-blue-500/20"
                iconColor="text-blue-500 dark:text-blue-400"
                title="Experiencia"
                count={experience.length}
                moreHref={isPublicView ? undefined : '/dashboard/experience'}
              />
              {latestExp === null ? (
                <EmptyState
                  icon={Briefcase}
                  title="Sin experiencia laboral"
                  description="¡Añade tu primera empresa y cuéntale al mundo dónde has trabajado!"
                  cta="Añadir experiencia"
                  href="/dashboard/experience"
                />
              ) : isPublicView ? (
                <div
                  className="space-y-3 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-track]:transparent"
                  style={{ maxHeight: '290px', scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}
                >
                  {experience.map((exp, idx) => (
                    <div
                      key={exp.work_experience_id}
                      className={cn('flex gap-3', idx < experience.length - 1 && 'pb-3 border-b border-border/40')}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                        {exp.logo_url ? (
                          <img src={exp.logo_url} alt={exp.company_name} className="h-5 w-5 rounded-lg object-contain" />
                        ) : (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{exp.job_title}</p>
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">{exp.company_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {fmtPeriod(exp.start_date, exp.end_date, exp.is_current)}
                          </span>
                          {exp.is_current && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              <CircleDot className="h-2.5 w-2.5" />Actual
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="overflow-hidden"
                  style={
                    experience.length > 1
                      ? {
                          maxHeight: '118px',
                          maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                        }
                      : undefined
                  }
                >
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                      {latestExp.logo_url ? (
                        <img
                          src={latestExp.logo_url}
                          alt={latestExp.company_name}
                          className="h-6 w-6 rounded-lg object-contain"
                        />
                      ) : (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{latestExp.job_title}</p>
                      <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                        {latestExp.company_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmtPeriod(latestExp.start_date, latestExp.end_date, latestExp.is_current)}
                        </span>
                        {latestExp.is_current && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CircleDot className="h-2.5 w-2.5" />
                            Actual
                          </span>
                        )}
                      </div>
                      {latestExp.description && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                          {latestExp.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </BentoCard>
        )}

        {/* C) EDUCATION */}
        {(!isPublicView || latestEdu !== null) && (
          <BentoCard
            editHref="/dashboard/education"
            isEmpty={!isPublicView && latestEdu === null}
            isPublicView={isPublicView}
          >
            <div className="p-5">
              <CardHeader
                icon={GraduationCap}
                iconBg="bg-amber-500/10 border-amber-500/20"
                iconColor="text-amber-500 dark:text-amber-400"
                title="Educación"
                count={education.length}
                moreHref={isPublicView ? undefined : '/dashboard/education'}
              />
              {latestEdu === null ? (
                <EmptyState
                  icon={GraduationCap}
                  title="Sin formación registrada"
                  description="Agrega tu universidad o cursos y muestra tu formación."
                  cta="Añadir formación"
                  href="/dashboard/education"
                />
              ) : isPublicView ? (
                <div
                  className="space-y-3 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-track]:transparent"
                  style={{ maxHeight: '240px', scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}
                >
                  {education.map((edu, idx) => (
                    <div
                      key={edu.academic_record_id}
                      className={cn('flex gap-3', idx < education.length - 1 && 'pb-3 border-b border-border/40')}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{edu.degree_title}</p>
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">{edu.institution_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] text-muted-foreground">
                            {fmtPeriod(edu.start_date, edu.end_date, edu.in_progress)}
                          </span>
                          {edu.in_progress && (
                            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
                              En curso
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="overflow-hidden"
                  style={
                    education.length > 1
                      ? {
                          maxHeight: '100px',
                          maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                        }
                      : undefined
                  }
                >
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{latestEdu.degree_title}</p>
                      <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5">
                        {latestEdu.institution_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">
                          {fmtPeriod(latestEdu.start_date, latestEdu.end_date, latestEdu.in_progress)}
                        </span>
                        {latestEdu.in_progress && (
                          <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
                            En curso
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </BentoCard>
        )}

        {/* D) PROYECTOS DESTACADOS */}
        {(!isPublicView || displayProjects.length > 0) && (
          <BentoCard
            editHref="/dashboard/projects"
            isEmpty={!isPublicView && displayProjects.length === 0}
            className="lg:col-span-2"
            isPublicView={isPublicView}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <FolderKanban className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Proyectos Destacados</h3>
                  {projects.length > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {projects.length}
                    </span>
                  )}
                </div>
                {!isPublicView && projects.length > 2 && (
                  <Link
                    to="/dashboard/projects"
                    className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-violet-500 transition-colors"
                  >
                    Ver todos <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {displayProjects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="Sin proyectos aún"
                  description="¡Sube tu primera evidencia! Los proyectos son lo más impactante de tu portafolio."
                  cta="Crear proyecto"
                  href="/dashboard/projects"
                />
              ) : (
                <div
                  className={cn(
                    isPublicView
                      ? 'overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-track]:transparent'
                      : 'overflow-hidden'
                  )}
                  style={
                    isPublicView
                      ? { maxHeight: '360px', scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }
                      : (projects.length > 2
                          ? {
                              maxHeight: '240px',
                              maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
                              WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
                            }
                          : undefined)
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {displayProjects.map((p, i) => (
                      <MiniProjectCard key={p.id} project={p} index={i} isPublicView={isPublicView} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </BentoCard>
        )}

        {/* E) CV STUDIO — full width (col-span-3) */}
        <BentoCard
            editHref="/dashboard/cv-studio"
            className="col-span-1 md:col-span-2 lg:col-span-3"
            isPublicView={isPublicView}
          >
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">

                {/* Left: icon + title */}
                <div className="flex items-center gap-3 md:w-52 shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-500/10 border border-zinc-500/20 dark:border-zinc-500/25 shrink-0">
                    <SplitSquareHorizontal className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">CV Studio</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Formatos exportables</p>
                  </div>
                </div>

                {/* Middle: status chips */}
                <div className="flex flex-1 gap-2 flex-wrap">
                  <div className="rounded-xl border border-border bg-background/60 px-3 py-2 flex items-center gap-2 flex-1 min-w-[140px]">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="text-xs text-muted-foreground">Formato activo</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                      <span className="text-xs font-semibold text-foreground">Markdown</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 px-3 py-2 flex items-center gap-2 flex-1 min-w-[120px]">
                    <span className="text-xs text-muted-foreground">Última versión</span>
                    <span className="ml-auto text-xs font-medium text-foreground">CV_v2.md</span>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 px-3 py-2 flex items-center gap-2 flex-1 min-w-[120px]">
                    <span className="text-xs text-muted-foreground">Secciones activas</span>
                    <span className="ml-auto text-xs font-medium text-foreground">5 / 6</span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex gap-2 shrink-0">
                  <button className="flex items-center gap-1.5 rounded-xl border border-border bg-background hover:border-violet-500/30 hover:bg-violet-500/5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-violet-600 dark:hover:text-violet-300 transition-all duration-200">
                    <Download className="h-3.5 w-3.5" />
                    Exportar CV
                  </button>
                  {!isPublicView && (
                    <Link
                      to="/dashboard/cv-studio"
                      className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar CV
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </BentoCard>

      </motion.div>
    </div>
  );
}

// ── Page (default export) ──────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectsStore();

  const [data, setData] = useState<ProfessionalDashboardData>(PORTFOLIO_MOCK_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    Promise.all([
      dashboardService.getProfessionalDashboard(user.id),
      fetchProjects(user.profile_id || user.id),
    ])
      .then(([d]) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <PortfolioSkeleton />;

  const allProjects = projects.length > 0 ? projects : PORTFOLIO_MOCK_PROJECTS;

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <PortfolioBentoView
          data={data}
          projects={allProjects}
          isPublicView={false}
          profileEmail={user?.email}
          profileWebsite={user?.website}
          profileSlug={user?.slug}
        />
      </div>
    </div>
  );
}

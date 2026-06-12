import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, Award, BadgeCheck, Briefcase, Building2, Calendar,
  ChevronRight, CircleDot, Code2, ExternalLink, Eye, FileText,
  FolderKanban, Github, Globe, GraduationCap, Heart, Link2, Lock,
  Mail, MapPin, MessageSquare, Sparkles, Star, Tag, BarChart3,
  BookOpen, Zap, X, Play, Image as ImageIcon, Link as LinkIcon,
  Layers, Activity, Clock, TrendingUp, User as ProfileIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EthosLogoIcon, EthosOwlMascot } from '@/components/brand/EthosCoreLogo';
import { useAuthStore } from '@/store/authStore';
import { portfolioService, type PublicPortfolio, type ProjectMedia } from '@/shared/services/portfolioService';
import { cn } from '@/shared/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Public-facing portfolio page rendered from a slug: shows projects, skills, experience, and PDF curriculum.
 */
function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
}
function fmtPeriod(start: string, end: string | null, isCurrent: boolean) {
  return `${fmt(start)} – ${isCurrent || !end ? 'Actualidad' : fmt(end)}`;
}

const parseTech = (t: unknown): string[] => {
  if (!t) return [];
  if (Array.isArray(t)) return t.filter(Boolean);
  if (typeof t === 'string') return t.split(',').map(x => x.trim()).filter(Boolean);
  return [];
};

const LEVEL_COLOR: Record<string, string> = {
  Junior: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  Mid:    'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400',
  Senior: 'bg-violet-500/15 border-violet-500/30 text-violet-600 dark:text-violet-400',
};

const STATUS_INFO: Record<string, { dot: string; label: string; bg: string }> = {
  draft:       { dot: 'bg-zinc-400',    label: 'Borrador',    bg: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500' },
  in_progress: { dot: 'bg-amber-400',   label: 'En progreso', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' },
  completed:   { dot: 'bg-emerald-400', label: 'Completado',  bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
  archived:    { dot: 'bg-zinc-600',    label: 'Archivado',   bg: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500' },
};

const AVAILABILITY: Record<string, { label: string; cls: string; dot: string }> = {
  open:        { label: 'Disponible',    cls: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-400 animate-pulse' },
  open_part:   { label: 'Part-time',     cls: 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400',         dot: 'bg-amber-400 animate-pulse' },
  not_looking: { label: 'No disponible', cls: 'bg-zinc-500/10 border-zinc-500/25 text-zinc-500',                                dot: 'bg-zinc-400' },
  freelance:   { label: 'Freelance',     cls: 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400',             dot: 'bg-blue-400 animate-pulse' },
};

const EDU_TYPES: Record<string, string> = {
  university:    'Universidad',
  master_degree: 'Maestría / Posgrado',
  phd:           'Doctorado (PhD)',
  certification: 'Certificación',
  course:        'Curso',
  bootcamp:      'Bootcamp',
  high_school:   'Secundaria',
  other:         'Otro',
};

// ── Animations ───────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 180, damping: 24 } },
};
const fadeIn = {
  hidden: { opacity: 0, scale: 0.97 },
  show:   { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 26 } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

// ── Project modal context ─────────────────────────────────────────────────────

interface ProjectModalCtx {
  openProject: (project: PublicPortfolio['projects'][0]) => void;
  closeProject: () => void;
  showDashboardLink: boolean;
}

const ProjectModalContext = createContext<ProjectModalCtx | null>(null);
const useProjectModal = () => useContext(ProjectModalContext)!;

type PublicDetailTab = 'overview' | 'technical' | 'media' | 'files';

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function PublicSectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/10">
        <Icon className="h-3 w-3 text-violet-600 dark:text-violet-400" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{children}</span>
    </div>
  );
}

function PublicInfoTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        <Icon className="h-3 w-3" />{label}
      </div>
      <div className="text-[13px] font-medium text-foreground leading-snug">{value}</div>
    </div>
  );
}

function PublicEmptyTab({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/50">
        <Icon className="h-5 w-5 text-muted-foreground/30" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 max-w-[260px] text-[12px] text-muted-foreground/60">{description}</p>
    </div>
  );
}

function isHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch { return false; }
}

function isEmbeddablePdf(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  const externalHosts = ['docs.google.com', 'drive.google.com', 'dropbox.com', 'onedrive.live.com', 'sharepoint.com'];
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    if (externalHosts.some(h => parsed.hostname.endsWith(h))) return false;
  } catch { return false; }
  return u.includes('.pdf') || u.includes('supabase');
}

function PublicProjectDetailModal({
  project,
  onClose,
  showDashboardLink = false,
}: {
  project: PublicPortfolio['projects'][0];
  onClose: () => void;
  showDashboardLink?: boolean;
}) {
  const [tab, setTab] = useState<PublicDetailTab>('overview');
  const status      = STATUS_INFO[project.status] ?? STATUS_INFO.draft;
  const tech        = project.technologies ?? [];
  const allMedia    = project.media ?? [];
  const mediaItems  = allMedia.filter(m => m.type !== 'document');
  const fileItems   = allMedia.filter(m => m.type === 'document');
  const hasMedia    = mediaItems.length > 0;
  const hasFiles    = fileItems.length > 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const tabs: { id: PublicDetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',  label: 'Resumen',    icon: Layers   },
    { id: 'technical', label: 'Técnico',    icon: Code2    },
    { id: 'media',     label: 'Media',      icon: Play     },
    { id: 'files',     label: 'Documentos', icon: FileText },
  ];

  const portalRoot = document.getElementById('portal-root') ?? document.body;
  return createPortal(
    <>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-[80] bg-background/75 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.85 }}
        className={cn(
          'absolute z-[81] flex flex-col overflow-hidden',
          'inset-0',
          'sm:inset-4 sm:rounded-2xl',
          'md:inset-6 lg:inset-[5vh_5vw]',
          'bg-background border border-border shadow-2xl shadow-black/40',
        )}
      >
        {}
        <div className="h-[2px] bg-gradient-to-r from-violet-700 via-violet-500 to-violet-300 shrink-0" />

        {}
        <div className="flex items-start justify-between gap-4 px-5 py-4 shrink-0 border-b border-border">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', status.bg)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />{status.label}
              </span>
              {project.category && (
                <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {project.category}
                </span>
              )}
              {project.isFeatured && (
                <span className="flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-600 dark:text-yellow-400">
                  <Star className="h-2.5 w-2.5 fill-current" /> Destacado
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold leading-tight text-foreground sm:text-xl">{project.title}</h2>
            {project.role && (
              <p className="mt-0.5 text-[13px] text-muted-foreground">{project.role}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {}
        <div className="flex items-center gap-0.5 border-b border-border px-5 shrink-0 overflow-x-auto scrollbar-hide">
          {tabs.map(({ id, label, icon: Icon }) => {
            const disabled = (id === 'media' && !hasMedia) || (id === 'files' && !hasFiles);
            return (
              <button
                key={id}
                onClick={() => !disabled && setTab(id)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-3 py-3 text-[12px] font-medium transition-colors whitespace-nowrap',
                  tab === id
                    ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                    : disabled
                    ? 'border-transparent text-muted-foreground/30 cursor-not-allowed'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {disabled && <span className="ml-1 text-[10px] opacity-60">0</span>}
              </button>
            );
          })}
        </div>

        {}
        <div className="flex-1 overflow-y-auto">

          {}
          {project.thumbnail && (tab === 'overview' || tab === 'technical') && (
            <div className="aspect-[21/7] overflow-hidden bg-muted">
              <img src={project.thumbnail} alt={project.title} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-6">

            {}
            {tab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
                {project.description && (
                  <div>
                    <PublicSectionLabel icon={FileText}>Descripción</PublicSectionLabel>
                    <p className="text-[14px] leading-relaxed text-foreground/80">{project.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {project.role && <PublicInfoTile icon={ProfileIcon} label="Rol" value={project.role} />}
                  {project.category && <PublicInfoTile icon={Tag} label="Categoría" value={project.category} />}
                </div>
                {project.results && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10">
                        <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">Resultados e impacto</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-foreground/80 break-all whitespace-pre-wrap">{project.results}</p>
                  </div>
                )}
                {project.isFeatured && (
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[12px] font-semibold text-yellow-600 dark:text-yellow-400">
                      <Star className="h-3 w-3 fill-current" /> Proyecto destacado
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {}
            {tab === 'technical' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
                {tech.length > 0 && (
                  <div>
                    <PublicSectionLabel icon={Tag}>Stack tecnológico</PublicSectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {tech.map((t) => (
                        <span key={t} className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-3 py-1.5 text-[12px] font-medium text-violet-700 dark:text-violet-300">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {project.repositoryUrl && (
                  <div>
                    <PublicSectionLabel icon={GithubMark}>Repositorio</PublicSectionLabel>
                    <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-[13px] text-foreground hover:bg-muted hover:border-foreground/20 transition-all group">
                      <GithubMark className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      <span className="truncate text-foreground/80 group-hover:text-foreground transition-colors flex-1">{project.repositoryUrl}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    </a>
                  </div>
                )}
                {project.results && (
                  <div>
                    <PublicSectionLabel icon={BarChart3}>Resultados obtenidos</PublicSectionLabel>
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-[13px] leading-relaxed text-foreground/80 break-all whitespace-pre-wrap">{project.results}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {}
            {tab === 'media' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                {hasMedia ? (
                  mediaItems.map((m, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-border bg-muted/10">
                      {(m.type === 'youtube' || m.type === 'vimeo' || m.type === 'video') && m.url && (
                        <div className="aspect-video">
                          <iframe src={m.url} title={m.title ?? `Video ${i + 1}`} className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        </div>
                      )}
                      {(m.type === 'image' || (!m.type && m.url)) && m.url && (
                        <a href={m.url} target="_blank" rel="noreferrer">
                          <img src={m.url} alt={m.title ?? `Imagen ${i + 1}`} className="w-full object-cover max-h-72" />
                          {m.title && <p className="px-4 py-2 text-[12px] text-muted-foreground">{m.title}</p>}
                        </a>
                      )}
                      {(m.type === 'figma' || m.type === 'slides' || m.type === 'link') && m.url && (
                        <div className="flex items-center justify-between p-3.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground shrink-0">
                              {m.type === 'slides' ? 'Google Slides' : m.type === 'figma' ? 'Figma' : 'Enlace'}
                            </span>
                            <span className="truncate text-[13px] text-foreground">{m.title ?? m.url}</span>
                          </div>
                          <a href={m.url} target="_blank" rel="noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <PublicEmptyTab icon={Play} title="Sin media" description="Este proyecto no tiene videos ni imágenes adjuntas." />
                )}
              </motion.div>
            )}

            {}
            {tab === 'files' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                {hasFiles ? (
                  fileItems.map((f, i) => {
                    const canEmbed = isEmbeddablePdf(f.url);
                    return (
                      <div key={i} className="overflow-hidden rounded-xl border border-border bg-muted/10">
                        {}
                        {canEmbed && f.url && (
                          <div className="w-full" style={{ height: 480 }}>
                            <iframe
                              src={f.url + '#toolbar=0&navpanes=0&scrollbar=0'}
                              className="w-full h-full"
                              title={f.title ?? `Documento ${i + 1}`}
                            />
                          </div>
                        )}
                        {}
                        <div className="flex items-center justify-between p-3.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                              <FileText className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-foreground">{f.title ?? 'Documento'}</p>
                              <p className="text-[11px] text-muted-foreground">{canEmbed ? 'Vista previa disponible' : 'Documento externo'}</p>
                            </div>
                          </div>
                          {isHttpUrl(f.url) && (
                            <a href={f.url ?? undefined} target="_blank" rel="noopener noreferrer"
                              className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-3">
                              <ExternalLink className="h-3.5 w-3.5" />Abrir
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <PublicEmptyTab icon={FileText} title="Sin documentos" description="Este proyecto no tiene documentos adjuntos." />
                )}
              </motion.div>
            )}

          </div>
        </div>

        {}
        <div className="flex items-center gap-2 border-t border-border bg-background/80 px-5 py-3.5 backdrop-blur-sm shrink-0 flex-wrap">
          {project.repositoryUrl && (
            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer"
              className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted hover:border-foreground/20 transition-all">
              <GithubMark className="h-4 w-4" /> Repositorio
            </a>
          )}
          {showDashboardLink ? (
            <Link
              to={`/dashboard/projects/${project.id}`}
              className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 py-2.5 text-[13px] font-semibold text-white transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Vista completa
            </Link>
          ) : (
            <button
              onClick={onClose}
              className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cerrar
            </button>
          )}
        </div>
      </motion.div>
    </>,
    portalRoot,
  );
}

function ProjectModalProvider({ children, showDashboardLink }: { children: ReactNode; showDashboardLink: boolean }) {
  const [selected, setSelected] = useState<PublicPortfolio['projects'][0] | null>(null);
  return (
    <ProjectModalContext.Provider value={{ openProject: setSelected, closeProject: () => setSelected(null), showDashboardLink }}>
      {children}
      <AnimatePresence>
        {selected && (
          <PublicProjectDetailModal
            key={selected.id}
            project={selected}
            onClose={() => setSelected(null)}
            showDashboardLink={showDashboardLink}
          />
        )}
      </AnimatePresence>
    </ProjectModalContext.Provider>
  );
}

type TabId = 'projects' | 'experience' | 'education' | 'skills' | 'curriculum';

// ── Portfolio Context ─────────────────────────────────────────────────────────

interface PortfolioCtx {
  portfolio: PublicPortfolio;
  isGuest: boolean;
  isPreview: boolean;
  likesCount: number | undefined;
}

const PortfolioContext = createContext<PortfolioCtx | null>(null);
const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio used outside PortfolioContext');
  return ctx;
};

// ── Tab Context (internal) ────────────────────────────────────────────────────

interface TabCtx { activeTab: TabId; setTab: (t: TabId) => void; }
const TabContext = createContext<TabCtx | null>(null);
const useTab = () => useContext(TabContext)!;

// ── Protected section ────────────────────────────────────────────────────────

function ProtectedSection({ isLocked, title, description, children }: {
  isLocked: boolean; title: string; description: string; children: ReactNode;
}) {
  if (!isLocked) return <>{children}</>;
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none select-none blur-sm saturate-50 opacity-50">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/75 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-xs rounded-2xl border border-border bg-card/95 p-5 text-center shadow-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 mx-auto mb-3">
            <Lock className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          <Link to="/login" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors">
            Crear cuenta o iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

function PublicPortfolioSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <div className="h-52 rounded-2xl bg-muted/40 animate-pulse" />
        <div className="h-11 rounded-xl bg-muted/40 animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-xl bg-muted/40 animate-pulse" />)}
        </div>
      </div>
    </div>
  );
}

function PortfolioNotFound({ slug }: { slug?: string }) {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <EthosOwlMascot size={90} className="mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Portafolio no encontrado</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          {slug ? `El portafolio "@${slug}" no existe o no está publicado.` : 'Este portafolio no está disponible.'}
        </p>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

function HeroSection() {
  const { portfolio, isPreview, isGuest, likesCount } = usePortfolio();
  const {
    name, professionalTitle, bio, location, email, website, photoUrl,
    accentColor, viewsCount, projects, experiences, hardSkills, softSkills,
    seniority, availabilityStatus,
  } = portfolio;

  const [collapsed, setCollapsed] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 90);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const avail = availabilityStatus ? AVAILABILITY[availabilityStatus] : null;

  return (
    <div ref={heroRef} className="sticky top-16 z-30 transition-all duration-300">
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          
          <motion.div
            key="compact"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 backdrop-blur-md px-4 py-2.5 shadow-lg"
            style={{ borderColor: `${accentColor}30` }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="h-8 w-8 rounded-xl object-cover shrink-0 ring-2 ring-background" />
            ) : (
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-black"
                style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`, color: accentColor }}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate leading-none">{name}</p>
              {professionalTitle && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{professionalTitle}</p>}
            </div>
            {avail && (
              <span className={cn('hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold', avail.cls)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', avail.dot)} />{avail.label}
              </span>
            )}
            {!isPreview && (
              isGuest ? (
                <Link to="/login" className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors">
                  <MessageSquare className="h-3 w-3" />Contactar
                </Link>
              ) : email ? (
                <a href={`mailto:${email}`} className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors">
                  <Mail className="h-3 w-3" />Contactar
                </a>
              ) : null
            )}
          </motion.div>
        ) : (
          
          <motion.div
            key="full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            style={{ borderColor: `${accentColor}28` }}
          >
            <div className="absolute inset-0 opacity-60" style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}08 40%, transparent 70%)` }} />
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full blur-3xl pointer-events-none" style={{ background: `${accentColor}18` }} />

            <div className="relative px-5 py-6 sm:px-7 sm:py-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                {}
                <div className="relative shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt={name}
                      className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl border-4 border-background object-cover shadow-xl ring-2 ring-white/10" />
                  ) : (
                    <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl border-4 border-background shadow-xl flex items-center justify-center text-3xl font-black"
                      style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`, color: accentColor }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {avail && (
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background">
                      <span className={cn('h-3 w-3 rounded-full', avail.dot)} />
                    </span>
                  )}
                </div>

                {}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{name}</h1>
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                      <BadgeCheck className="h-3 w-3" />Verificado
                    </span>
                    {seniority && (
                      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', LEVEL_COLOR[seniority] ?? 'bg-muted/60 border-border text-muted-foreground')}>
                        {seniority}
                      </span>
                    )}
                  </div>

                  {professionalTitle && (
                    <p className="text-base sm:text-lg font-semibold text-muted-foreground mb-2">{professionalTitle}</p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
                    {location && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" />{location}
                      </span>
                    )}
                    {email && !isGuest && (
                      <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-500 transition-colors">
                        <Mail className="h-3.5 w-3.5 text-violet-500" />{email}
                      </a>
                    )}
                    {website && (
                      <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-500 transition-colors">
                        <Globe className="h-3.5 w-3.5 text-blue-500" />{website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {avail && (
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', avail.cls)}>
                        <span className={cn('h-2 w-2 rounded-full', avail.dot)} />{avail.label}
                      </span>
                    )}
                    {!isPreview && (
                      isGuest ? (
                        <Link to="/login" className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-semibold text-white transition-all shadow-lg shadow-violet-500/25">
                          <MessageSquare className="h-3.5 w-3.5" />Contactar
                        </Link>
                      ) : email ? (
                        <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-semibold text-white transition-all shadow-lg shadow-violet-500/25">
                          <Mail className="h-3.5 w-3.5" />Contactar
                        </a>
                      ) : null
                    )}
                  </div>

                  {bio && bio.length < 200 && (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground max-w-2xl">{bio}</p>
                  )}
                </div>

                {}
                <div className="hidden lg:flex flex-col gap-2 shrink-0 min-w-[110px]">
                  {[
                    { label: 'Visitas',      value: viewsCount.toLocaleString('es-ES'),                   icon: Eye,          color: 'text-violet-500' },
                    { label: 'Me gustas',    value: likesCount !== undefined ? String(likesCount) : '—',   icon: Heart,        color: 'text-rose-500' },
                    { label: 'Proyectos',    value: String(projects.length),                               icon: FolderKanban, color: 'text-emerald-500' },
                    { label: 'Experiencias', value: String(experiences.length),                            icon: Briefcase,    color: 'text-blue-500' },
                    { label: 'Habilidades',  value: String(hardSkills.length + softSkills.length),         icon: Zap,          color: 'text-amber-500' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-3 py-2">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider leading-none mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-foreground">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {}
              <div className="grid grid-cols-5 gap-2 mt-4 lg:hidden">
                {[
                  { label: 'Visitas',   value: viewsCount.toLocaleString('es-ES'),                   icon: Eye,          color: 'text-violet-500' },
                  { label: 'Likes',     value: likesCount !== undefined ? String(likesCount) : '—',   icon: Heart,        color: 'text-rose-500' },
                  { label: 'Proyectos', value: String(projects.length),                               icon: FolderKanban, color: 'text-emerald-500' },
                  { label: 'Exp.',      value: String(experiences.length),                            icon: Briefcase,    color: 'text-blue-500' },
                  { label: 'Skills',    value: String(hardSkills.length + softSkills.length),         icon: Zap,          color: 'text-amber-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-background/50 px-2 py-2.5 text-center">
                    <Icon className={cn('h-4 w-4', color)} />
                    <p className="text-base font-black text-foreground">{value}</p>
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionTabBar() {
  const { portfolio } = usePortfolio();
  const { activeTab, setTab } = useTab();
  const { projects, experiences, education, hardSkills, softSkills, bio, email, website, cvPdfUrl, showGithubHeatmap } = portfolio;

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number; show: boolean }[] = ([
    { id: 'projects'   as TabId, label: 'Proyectos',   icon: FolderKanban,  count: projects.length,                       show: projects.length > 0 },
    { id: 'experience' as TabId, label: 'Experiencia', icon: Briefcase,     count: experiences.length,                    show: experiences.length > 0 },
    { id: 'education'  as TabId, label: 'Educación',   icon: GraduationCap, count: education.length,                      show: education.length > 0 },
    { id: 'skills'     as TabId, label: 'Habilidades', icon: Code2,         count: hardSkills.length + softSkills.length, show: hardSkills.length > 0 || softSkills.length > 0 },
    { id: 'curriculum' as TabId, label: 'Sobre mí',    icon: Sparkles,                                                    show: !!(bio || email || website || cvPdfUrl || showGithubHeatmap) },
  ] as const).filter(t => t.show);

  return (
    <div className="sticky top-16 z-20 mt-3">
      <div className="flex gap-1 rounded-2xl border border-border bg-card/95 backdrop-blur-md p-1.5 shadow-sm overflow-x-auto scrollbar-none">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap',
              activeTab === id
                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
            {count !== undefined && count > 0 && (
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums',
                activeTab === id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const PAGE_SIZE = 9;

function ProjectsPanel() {
  const { portfolio, isGuest, isPreview } = usePortfolio();
  const { projects } = portfolio;
  const [visible, setVisible] = useState(PAGE_SIZE);

  const featured = projects.filter(p => p.isFeatured);
  const rest      = projects.filter(p => !p.isFeatured);
  const allOther  = rest.slice(0, visible);
  const hasMore   = rest.length > visible;

  if (projects.length === 0) return <EmptyPanel label="No hay proyectos publicados aún." />;

  return (
    <ProtectedSection
      isLocked={!isPreview && isGuest}
      title="Proyectos visibles al registrarte"
      description="Crea una cuenta para ver proyectos, stack y resultados."
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        {}
        {featured.map(p => <FeaturedProjectCard key={p.id} project={p} />)}

        {}
        {rest.length > 0 && (
          <div className={cn(
            'grid gap-4',
            allOther.length === 1 && 'grid-cols-1 max-w-md',
            allOther.length === 2 && 'sm:grid-cols-2',
            allOther.length >= 3  && 'sm:grid-cols-2 lg:grid-cols-3',
          )}>
            {allOther.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}

        {}
        {hasMore && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setVisible(v => v + PAGE_SIZE)}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/8 px-5 py-2.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-500/15 transition-colors"
            >
              Cargar más proyectos
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-bold">
                {rest.length - visible} restantes
              </span>
            </button>
          </div>
        )}
      </motion.div>
    </ProtectedSection>
  );
}

function ExperiencePanel() {
  const { portfolio, isGuest, isPreview } = usePortfolio();
  const { experiences } = portfolio;
  if (experiences.length === 0) return <EmptyPanel label="No hay experiencias publicadas aún." />;
  return (
    <ProtectedSection
      isLocked={!isPreview && isGuest}
      title="Experiencia reservada"
      description="Inicia sesión para ver empresas, roles y trayectoria."
    >
      <motion.div
        variants={stagger} initial="hidden" animate="show"
        className={cn(
          'grid gap-4',
          experiences.length === 1 && 'grid-cols-1 max-w-lg',
          experiences.length === 2 && 'sm:grid-cols-2',
          experiences.length >= 3  && 'sm:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {experiences.map(exp => <ExperienceCard key={exp.id} exp={exp} />)}
      </motion.div>
    </ProtectedSection>
  );
}

function EducationPanel() {
  const { portfolio, isGuest, isPreview } = usePortfolio();
  const { education } = portfolio;
  if (education.length === 0) return <EmptyPanel label="No hay educación publicada aún." />;
  return (
    <ProtectedSection
      isLocked={!isPreview && isGuest}
      title="Educación privada"
      description="Inicia sesión para ver formación e instituciones."
    >
      <motion.div
        variants={stagger} initial="hidden" animate="show"
        className={cn(
          'grid gap-4',
          education.length === 1 && 'grid-cols-1 max-w-lg',
          education.length === 2 && 'sm:grid-cols-2',
          education.length >= 3  && 'sm:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {education.map(edu => <EducationCard key={edu.id} edu={edu} />)}
      </motion.div>
    </ProtectedSection>
  );
}

function SkillsPanel() {
  const { portfolio, isGuest, isPreview } = usePortfolio();
  const { hardSkills, softSkills } = portfolio;
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(hardSkills.map(s => s.category).filter(Boolean) as string[]))];
  const filteredHard = activeCategory === 'all' ? hardSkills : hardSkills.filter(s => s.category === activeCategory);

  if (hardSkills.length === 0 && softSkills.length === 0) return <EmptyPanel label="No hay habilidades publicadas aún." />;

  return (
    <ProtectedSection
      isLocked={!isPreview && isGuest}
      title="Skills protegidas"
      description="Regístrate para ver habilidades técnicas y niveles."
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

        {}
        {hardSkills.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                <Code2 className="h-4 w-4 text-violet-500" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Habilidades técnicas</h2>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{filteredHard.length}</span>
            </div>

            {}
            {categories.length > 2 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                      activeCategory === cat
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20',
                    )}
                  >
                    {cat === 'all' ? 'Todas' : cat}
                  </button>
                ))}
              </div>
            )}

            <motion.div variants={stagger} className="flex flex-wrap gap-2">
              {filteredHard.map(skill => {
                const cls = LEVEL_COLOR[skill.level ?? ''] ?? 'bg-muted/60 border-border text-muted-foreground';
                return (
                  <motion.span key={skill.id} variants={fadeUp}
                    className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold', cls)}>
                    <Code2 className="h-3 w-3 opacity-60" />
                    {skill.name}
                    {skill.level && <span className="opacity-55">· {skill.level}</span>}
                  </motion.span>
                );
              })}
            </motion.div>
          </div>
        )}

        {}
        {softSkills.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
                <Sparkles className="h-4 w-4 text-rose-500" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Habilidades blandas</h2>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{softSkills.length}</span>
            </div>
            <motion.div variants={stagger} className="flex flex-wrap gap-2">
              {softSkills.map(skill => (
                <motion.span key={skill.id} variants={fadeUp}
                  className="inline-flex items-center rounded-full border border-rose-500/25 bg-rose-500/[0.08] px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {skill.name}
                </motion.span>
              ))}
            </motion.div>
          </div>
        )}
      </motion.div>
    </ProtectedSection>
  );
}

function CurriculumPanel() {
  const { portfolio, isGuest, isPreview } = usePortfolio();
  const { bio, email, website, cvPdfUrl, showGithubHeatmap, accentColor } = portfolio;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

      {}
      {bio && (
        <ProtectedSection
          isLocked={!isPreview && isGuest}
          title="Desbloquea el resumen completo"
          description="Crea tu cuenta para ver el contexto profesional."
        >
          <motion.div variants={fadeIn} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                <Sparkles className="h-4 w-4 text-violet-500" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Acerca de</h2>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">{bio}</p>
          </motion.div>
        </ProtectedSection>
      )}

      {}
      {(email || website) && (
        <ProtectedSection
          isLocked={!isPreview && isGuest}
          title="Contacto disponible al iniciar sesión"
          description="Entra para ver los enlaces de contacto."
        >
          <motion.div variants={fadeIn} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                <Link2 className="h-4 w-4 text-violet-500" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Contacto</h2>
            </div>
            <div className="space-y-2">
              {email && (
                <a href={`mailto:${email}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3 transition-all hover:bg-muted/40 hover:border-violet-500/30 group">
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                    <Mail className="h-4 w-4 text-violet-500" />Correo profesional
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                </a>
              )}
              {website && (
                <a href={website} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3 transition-all hover:bg-muted/40 hover:border-violet-500/30 group">
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                    <Globe className="h-4 w-4 text-blue-500" />Sitio personal
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-500 transition-colors" />
                </a>
              )}
            </div>
            <div className="mt-5 flex items-center gap-2.5 border-t border-border/50 pt-4">
              <EthosOwlMascot size={32} floating={false} />
              <div>
                <p className="text-[11px] font-bold text-foreground leading-none">EthosHub</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Red de talento verificado</p>
              </div>
            </div>
          </motion.div>
        </ProtectedSection>
      )}

      {}
      {cvPdfUrl && (
        <motion.div variants={fadeIn} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
              <FileText className="h-4 w-4 text-violet-500" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Currículum</h2>
          </div>
          <div className="w-full rounded-xl border border-border overflow-hidden bg-muted/20" style={{ height: 520 }}>
            <iframe src={cvPdfUrl + '#toolbar=0&navpanes=0&scrollbar=0'} className="w-full h-full" title="Currículum PDF" />
          </div>
          <a href={cvPdfUrl} target="_blank" rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-violet-500/25 bg-violet-500/8 px-4 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-500/15 transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />Descargar PDF
          </a>
        </motion.div>
      )}

      {}
      {showGithubHeatmap && (
        <motion.div variants={fadeIn} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
              <Github className="h-4 w-4 text-violet-500" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Actividad en GitHub</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 ml-10">Contribuciones públicas del último año</p>
          <div className="w-full overflow-x-auto">
            <GithubHeatmap />
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground/40">
            Datos en tiempo real disponibles cuando conectes tu cuenta de GitHub.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

function ActiveSectionPanel() {
  const { activeTab } = useTab();
  return (
    <div className="mt-4 pb-20">
      <AnimatePresence mode="wait">
        {activeTab === 'projects'   && <motion.div key="projects"   initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><ProjectsPanel /></motion.div>}
        {activeTab === 'experience' && <motion.div key="experience" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><ExperiencePanel /></motion.div>}
        {activeTab === 'education'  && <motion.div key="education"  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><EducationPanel /></motion.div>}
        {activeTab === 'skills'     && <motion.div key="skills"     initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><SkillsPanel /></motion.div>}
        {activeTab === 'curriculum' && <motion.div key="curriculum" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}><CurriculumPanel /></motion.div>}
      </AnimatePresence>

      {}
      <div className="flex flex-col items-center gap-3 pt-10">
        <EthosOwlMascot size={44} className="opacity-50" />
        <div className="flex items-center gap-2">
          <EthosLogoIcon size={13} animate={false} />
          <span className="text-[11px] text-muted-foreground/40 font-medium">Portafolio creado en EthosHub</span>
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
      <EthosOwlMascot size={64} className="mx-auto mb-3 opacity-60" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function getInitialTab(portfolio: PublicPortfolio): TabId {
  if (portfolio.projects.length > 0)    return 'projects';
  if (portfolio.experiences.length > 0) return 'experience';
  if (portfolio.education.length > 0)   return 'education';
  if (portfolio.hardSkills.length > 0 || portfolio.softSkills.length > 0) return 'skills';
  return 'curriculum';
}

export function PortfolioPublicView({
  portfolio,
  isPreview = false,
  isGuest = false,
  isOwner = false,
}: {
  portfolio: PublicPortfolio;
  isPreview?: boolean;
  isGuest?: boolean;
  isOwner?: boolean;
}) {
  const { slug } = portfolio;
  const [likesCount, setLikesCount] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabId>(() => getInitialTab(portfolio));

  useEffect(() => {
    if (isPreview || !slug || !supabase) return;
    (async () => {
      try {
        const { data: psData } = await supabase!
          .from('portfolio_settings').select('profile_id').eq('slug', slug).single();
        if (!psData?.profile_id) return;
        const { data: count } = await supabase!.rpc('get_profile_likes_count', { p_basic_profile_id: psData.profile_id });
        if (typeof count === 'number') setLikesCount(count);
      } catch {  }
    })();
  }, [slug, isPreview]);

  return (
    <PortfolioContext.Provider value={{ portfolio, isGuest, isPreview, likesCount }}>
      <TabContext.Provider value={{ activeTab, setTab: setActiveTab }}>
        <ProjectModalProvider showDashboardLink={isPreview || isOwner}>
        <div className={cn('bg-background', !isPreview && 'min-h-screen pt-20')}>

          {}
          {isPreview && (
            <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-4 pb-2">
              <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                <Eye className="h-4 w-4 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  <strong>Vista previa</strong> — así es como ven tu portafolio los visitantes.
                </p>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            {}
            <HeroSection />

            {}
            {!isPreview && isGuest && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-violet-500/25 bg-violet-500/5 px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <EthosOwlMascot size={36} floating={false} />
                  <div>
                    <p className="text-sm font-bold text-foreground">¡Regístrate para ver el perfil completo!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Contáctalo, ve sus proyectos y habilidades sin límites.</p>
                  </div>
                </div>
                <Link to="/login" className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-lg shadow-violet-500/25">
                  Crear cuenta <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            )}

            {}
            <SectionTabBar />

            {}
            <ActiveSectionPanel />
          </div>
        </div>
        </ProjectModalProvider>
      </TabContext.Provider>
    </PortfolioContext.Provider>
  );
}

function ProjectDetailContent({ project }: { project: PublicPortfolio['projects'][0] }) {
  const status = STATUS_INFO[project.status] ?? STATUS_INFO.draft;
  const media  = project.media ?? [];
  const images = media.filter(m => m.type === 'image' || (!m.type && m.url));
  const videos = media.filter(m => m.type === 'video');
  const links  = media.filter(m => m.type === 'link');

  return (
    <div className="space-y-6">
      {}
      <div className="space-y-2">
        {project.isFeatured && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />Proyecto destacado
          </span>
        )}
        <h2 className="text-xl font-black text-foreground leading-tight">{project.title}</h2>
        <div className="flex flex-wrap gap-2">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', status.bg)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />{status.label}
          </span>
          {project.role && (
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">{project.role}</span>
          )}
          {project.category && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground/80">
              <Tag className="h-3 w-3" />{project.category}
            </span>
          )}
        </div>
      </div>

      {}
      {project.thumbnail && (
        <div className="overflow-hidden rounded-xl border border-border">
          <img src={project.thumbnail} alt={project.title} className="w-full object-cover max-h-56" />
        </div>
      )}

      {}
      {project.description && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descripción</p>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {}
      {project.technologies.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stack tecnológico</p>
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map(t => (
              <span key={t} className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-300">{t}</span>
            ))}
          </div>
        </div>
      )}

      {}
      {project.results && (
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-3 space-y-1.5">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />Resultados e impacto
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{project.results}</p>
        </div>
      )}

      {}
      {project.repositoryUrl && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Repositorio</p>
          <a href={project.repositoryUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-3 text-xs font-medium text-foreground hover:border-violet-500/30 hover:bg-muted/40 transition-all group">
            <Github className="h-4 w-4 text-muted-foreground group-hover:text-violet-500 transition-colors shrink-0" />
            <span className="truncate">{project.repositoryUrl}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-violet-500 transition-colors ml-auto" />
          </a>
        </div>
      )}

      {}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Imágenes</p>
          <div className="grid grid-cols-2 gap-2">
            {images.map((m, i) => m.url && (
              <a key={i} href={m.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-border">
                <img src={m.url} alt={m.title ?? `Imagen ${i + 1}`}
                  className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" />
                {m.title && <p className="px-2 py-1 text-[10px] text-muted-foreground truncate">{m.title}</p>}
              </a>
            ))}
          </div>
        </div>
      )}

      {}
      {videos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Videos</p>
          <div className="space-y-2">
            {videos.map((m, i) => m.url && (
              <a key={i} href={m.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-4 py-3 text-xs font-medium text-foreground hover:border-violet-500/30 hover:bg-muted/40 transition-all group">
                <Play className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="truncate flex-1">{m.title ?? m.url}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-violet-500 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

      {}
      {links.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Enlaces</p>
          <div className="space-y-2">
            {links.map((m, i) => m.url && (
              <a key={i} href={m.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-4 py-3 text-xs font-medium text-foreground hover:border-blue-500/30 hover:bg-muted/40 transition-all group">
                <LinkIcon className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="truncate flex-1">{m.title ?? m.url}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExperienceDetailContent({ exp }: { exp: PublicPortfolio['experiences'][0] }) {
  const hasCoords = exp.latitude != null && exp.longitude != null;
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${exp.longitude! - 0.015},${exp.latitude! - 0.01},${exp.longitude! + 0.015},${exp.latitude! + 0.01}&layer=mapnik&marker=${exp.latitude},${exp.longitude}`
    : exp.location
      ? `https://www.openstreetmap.org/export/embed.html?query=${encodeURIComponent(exp.location)}&layer=mapnik`
      : null;
  const mapLink = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${exp.latitude}&mlon=${exp.longitude}#map=15/${exp.latitude}/${exp.longitude}`
    : exp.location
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(exp.location)}`
      : null;

  return (
    <div className="space-y-6">
      {}
      {exp.companyImageUrl && (
        <div className="overflow-hidden rounded-xl border border-border -mx-1">
          <img src={exp.companyImageUrl} alt={`${exp.companyName} banner`}
            className="w-full h-36 object-cover" />
        </div>
      )}

      {}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/50">
          {exp.logoUrl
            ? <img src={exp.logoUrl} alt={exp.companyName} className="h-9 w-9 rounded object-contain" />
            : <Building2 className="h-6 w-6 text-blue-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-black text-foreground leading-tight">{exp.jobTitle}</h2>
            {exp.isCurrent && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <CircleDot className="h-2.5 w-2.5" />Actual
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-violet-600 dark:text-violet-400 mt-0.5">{exp.companyName}</p>
          {exp.companyUrl && (
            <a href={exp.companyUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors mt-1">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[220px]">{exp.companyUrl.replace(/^https?:\/\//, '')}</span>
              <ArrowUpRight className="h-2.5 w-2.5 shrink-0 opacity-60" />
            </a>
          )}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-3">
          <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
          <span className="text-sm text-muted-foreground">{fmtPeriod(exp.startDate, exp.endDate, exp.isCurrent)}</span>
        </div>
        {exp.location && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-3">
            <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{exp.location}</span>
          </div>
        )}
      </div>

      {}
      {exp.description && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descripción y logros</p>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{exp.description}</p>
        </div>
      )}

      {}
      {parseTech(exp.technologies).length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tecnologías utilizadas</p>
          <div className="flex flex-wrap gap-1.5">
            {parseTech(exp.technologies).map(t => (
              <span key={t} className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-300">{t}</span>
            ))}
          </div>
        </div>
      )}

      {}
      {mapSrc && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ubicación</p>
          <div className="overflow-hidden rounded-xl border border-border" style={{ height: 200 }}>
            <iframe
              src={mapSrc}
              className="w-full h-full"
              title="Ubicación de la empresa"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
          {mapLink && (
            <a href={mapLink} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-blue-500 transition-colors">
              <MapPin className="h-3 w-3" />Abrir en OpenStreetMap
              <ArrowUpRight className="h-2.5 w-2.5 opacity-60" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function CredentialPreview({ url, label }: { url: string; label: string }) {
  const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="overflow-hidden rounded-xl border border-border bg-muted/10">
        {isPdf ? (
          <iframe
            src={url + '#toolbar=0&navpanes=0&scrollbar=0'}
            className="w-full"
            style={{ height: 380 }}
            title={label}
          />
        ) : (
          <img src={url} alt={label} className="w-full object-contain max-h-80" />
        )}
      </div>
      <a
        href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 transition-colors"
      >
        <ExternalLink className="h-3 w-3" />Abrir en nueva pestaña
      </a>
    </div>
  );
}

function EducationDetailContent({ edu }: { edu: PublicPortfolio['education'][0] }) {
  return (
    <div className="space-y-6">
      {}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/50">
          {edu.logoUrl
            ? <img src={edu.logoUrl} alt={edu.institution} className="h-9 w-9 rounded object-contain" />
            : <GraduationCap className="h-6 w-6 text-amber-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-black text-foreground leading-tight">{edu.degree}</h2>
            {edu.inProgress && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />En curso
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-violet-600 dark:text-violet-400 mt-0.5">{edu.institution}</p>
          {edu.fieldOfStudy && (
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 shrink-0 text-amber-500/60" />{edu.fieldOfStudy}
            </p>
          )}
        </div>
      </div>

      {}
      <div className="flex flex-wrap gap-2">
        {edu.educationType && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            <Award className="h-3 w-3" />{EDU_TYPES[edu.educationType] ?? edu.educationType}
          </span>
        )}
        {edu.gpa != null && (
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-400">
            <Star className="h-3 w-3" />Promedio: {Number(edu.gpa).toFixed(2)}
          </span>
        )}
      </div>

      {}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-4 py-3">
        <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
        <span className="text-sm text-muted-foreground">{fmtPeriod(edu.startDate, edu.endDate, edu.inProgress)}</span>
      </div>

      {}
      {edu.description && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Descripción</p>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{edu.description}</p>
        </div>
      )}

      {}
      {edu.credentialUrl && (
        <CredentialPreview url={edu.credentialUrl} label="Certificado / Credencial" />
      )}

      {}
      {edu.verificationUrl && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verificación oficial</p>
          <a href={edu.verificationUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-colors group">
            <BadgeCheck className="h-4 w-4 shrink-0" />
            <span className="truncate flex-1">Verificar credencial</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      )}
    </div>
  );
}

function ExperienceCard({ exp }: { exp: PublicPortfolio['experiences'][0] }) {
  const [open, setOpen] = useState(false);
  const portalRoot = document.getElementById('portal-root') ?? document.body;
  return (
    <>
    {open && createPortal(
      <>
        <motion.div key="exp-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }} className="absolute inset-0 z-[80] bg-background/75 backdrop-blur-md"
          onClick={() => setOpen(false)} />
        <motion.div key="exp-modal" initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.85 }}
          className={cn('absolute z-[81] flex flex-col overflow-hidden','inset-0','sm:inset-4 sm:rounded-2xl','md:inset-6 lg:inset-[5vh_5vw]','bg-background border border-border shadow-2xl shadow-black/40')}>
          <div className="h-[2px] bg-gradient-to-r from-blue-700 via-blue-500 to-blue-300 shrink-0" />
          <div className="flex items-center justify-between gap-4 px-5 py-4 shrink-0 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">{exp.jobTitle}</h2>
            <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <ExperienceDetailContent exp={exp} />
          </div>
        </motion.div>
      </>,
      portalRoot,
    )}
    <motion.article
      variants={fadeUp}
      onClick={() => setOpen(true)}
      className="group relative rounded-xl border border-border bg-background/60 p-4 hover:border-blue-500/30 hover:shadow-[0_0_16px_rgba(59,130,246,0.08)] transition-all duration-300 flex flex-col gap-3 cursor-pointer"
    >
      {exp.isCurrent && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          <CircleDot className="h-2.5 w-2.5" />Actual
        </span>
      )}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
          {exp.logoUrl
            ? <img src={exp.logoUrl} alt={exp.companyName} className="h-6 w-6 rounded object-contain" />
            : <Building2 className="h-4 w-4 text-blue-500" />}
        </div>
        <div className="min-w-0 flex-1 pr-10">
          <p className="text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">{exp.jobTitle}</p>
          <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mt-0.5">{exp.companyName}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Calendar className="h-3 w-3 shrink-0 text-blue-400" />
        {fmtPeriod(exp.startDate, exp.endDate, exp.isCurrent)}
      </p>
      {exp.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{exp.description}</p>
      )}
      {parseTech(exp.technologies).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {parseTech(exp.technologies).slice(0, 4).map(t => (
            <span key={t} className="inline-block rounded-lg border border-violet-500/20 bg-violet-500/5 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">{t}</span>
          ))}
          {parseTech(exp.technologies).length > 4 && (
            <span className="inline-block rounded-lg border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">+{parseTech(exp.technologies).length - 4}</span>
          )}
        </div>
      )}
    </motion.article>
    </>
  );
}

function FeaturedProjectCard({ project }: { project: PublicPortfolio['projects'][0] }) {
  const status = STATUS_INFO[project.status] ?? STATUS_INFO.draft;
  const { openProject, showDashboardLink } = useProjectModal();
  return (
    <motion.article
      variants={fadeIn}
      onClick={() => openProject(project)}
      className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card hover:border-amber-500/35 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all duration-300 cursor-pointer"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-72 lg:w-80 shrink-0">
          {project.thumbnail ? (
            <div className="relative h-48 sm:h-full min-h-[200px] overflow-hidden">
              <img src={project.thumbnail} alt={project.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30 sm:bg-gradient-to-l" />
            </div>
          ) : (
            <div className="flex h-48 sm:h-full min-h-[200px] items-center justify-center bg-gradient-to-br from-amber-500/10 to-muted/30">
              <FolderKanban className="h-16 w-16 text-amber-500/20" />
            </div>
          )}
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/30 px-3 py-1 text-[11px] font-bold text-white">
            <Star className="h-3 w-3 fill-white" />Destacado
          </span>
        </div>
        <div className="flex-1 p-5 sm:p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-black text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">{project.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold', status.bg)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />{status.label}
            </span>
            {project.role && <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">{project.role}</span>}
            {project.category && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground/80">
                <Tag className="h-3 w-3" />{project.category}
              </span>
            )}
          </div>
          {project.description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{project.description}</p>}
          {project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {project.technologies.slice(0, 5).map(t => (
                <span key={t} className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-1 text-[11px] font-medium text-violet-700 dark:text-violet-300">{t}</span>
              ))}
              {project.technologies.length > 5 && (
                <span className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground">+{project.technologies.length - 5}</span>
              )}
            </div>
          )}
          {project.results && (
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-2.5">
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{project.results}</p>
            </div>
          )}
          {showDashboardLink && (
            <div className="mt-auto pt-2 flex justify-end" onClick={e => e.stopPropagation()}>
              <Link to={`/dashboard/projects/${project.id}`} title="Vista completa"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ProjectCard({ project }: { project: PublicPortfolio['projects'][0] }) {
  const status = STATUS_INFO[project.status] ?? STATUS_INFO.draft;
  const { openProject, showDashboardLink } = useProjectModal();
  return (
    <motion.article
      variants={fadeUp}
      onClick={() => openProject(project)}
      className="group overflow-hidden rounded-xl border border-border bg-background hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-300 flex flex-col cursor-pointer"
    >
      {project.thumbnail ? (
        <div className="relative h-44 overflow-hidden shrink-0">
          <img src={project.thumbnail} alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center bg-gradient-to-br from-muted/60 to-muted/30 border-b border-border shrink-0">
          <FolderKanban className="h-8 w-8 text-muted-foreground/20" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">{project.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', status.bg)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />{status.label}
          </span>
          {project.role && <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">{project.role}</span>}
          {project.category && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground/80">
              <Tag className="h-2.5 w-2.5" />{project.category}
            </span>
          )}
        </div>
        {project.description && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{project.description}</p>}
        {project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.technologies.slice(0, 4).map(t => (
              <span key={t} className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">{t}</span>
            ))}
            {project.technologies.length > 4 && (
              <span className="rounded-lg border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">+{project.technologies.length - 4}</span>
            )}
          </div>
        )}
        {project.results && (
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{project.results}</p>
          </div>
        )}
        {showDashboardLink && (
          <div className="mt-auto pt-2 flex justify-end border-t border-border" onClick={e => e.stopPropagation()}>
            <Link to={`/dashboard/projects/${project.id}`} title="Vista completa"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </motion.article>
  );
}

function EducationCard({ edu }: { edu: PublicPortfolio['education'][0] }) {
  const [open, setOpen] = useState(false);
  const portalRoot = document.getElementById('portal-root') ?? document.body;
  return (
    <>
    {open && createPortal(
      <>
        <motion.div key="edu-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }} className="absolute inset-0 z-[80] bg-background/75 backdrop-blur-md"
          onClick={() => setOpen(false)} />
        <motion.div key="edu-modal" initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.85 }}
          className={cn('absolute z-[81] flex flex-col overflow-hidden','inset-0','sm:inset-4 sm:rounded-2xl','md:inset-6 lg:inset-[5vh_5vw]','bg-background border border-border shadow-2xl shadow-black/40')}>
          <div className="h-[2px] bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300 shrink-0" />
          <div className="flex items-center justify-between gap-4 px-5 py-4 shrink-0 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">{edu.degree}</h2>
            <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <EducationDetailContent edu={edu} />
          </div>
        </motion.div>
      </>,
      portalRoot,
    )}
    <motion.div
      variants={fadeUp}
      onClick={() => setOpen(true)}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 hover:border-amber-500/30 hover:shadow-[0_0_16px_rgba(245,158,11,0.08)] transition-all duration-300 cursor-pointer"
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
          {edu.logoUrl
            ? <img src={edu.logoUrl} alt={edu.institution} className="h-6 w-6 rounded object-contain" />
            : <GraduationCap className="h-4 w-4 text-amber-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">{edu.degree}</p>
          {edu.fieldOfStudy && (
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <BookOpen className="h-2.5 w-2.5 shrink-0 text-amber-500/60" />{edu.fieldOfStudy}
            </p>
          )}
          <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mt-0.5">{edu.institution}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {edu.educationType && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            <Award className="h-2.5 w-2.5" />{EDU_TYPES[edu.educationType] ?? edu.educationType}
          </span>
        )}
        {edu.inProgress && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />En curso
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Calendar className="h-3 w-3 shrink-0 text-amber-400" />
        {fmtPeriod(edu.startDate, edu.endDate, edu.inProgress)}
      </p>
    </motion.div>
    </>
  );
}

function GithubHeatmap() {
  const cells = Array.from({ length: 52 * 7 }, (_, i) => ({
    i,
    active: Math.random() > 0.55,
    intensity: Math.random(),
  }));
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 11px)', gridAutoFlow: 'column', gap: '3px', width: 'max-content', minWidth: '100%' }}>
      {cells.map(({ i, active, intensity }) => (
        <div key={i} className="rounded-sm transition-colors" style={{
          width: 11, height: 11,
          backgroundColor: active ? `rgba(124,58,237,${(intensity * 0.65 + 0.25).toFixed(2)})` : 'rgba(124,58,237,0.07)',
        }} />
      ))}
    </div>
  );
}

function useSeoMeta(portfolio: PublicPortfolio | null) {
  useEffect(() => {
    if (!portfolio) return;
    const title = portfolio.seoTitle?.trim() || `${portfolio.name} — Portafolio profesional en EthosHub`;
    const description = portfolio.seoDescription?.trim() || portfolio.bio?.slice(0, 155) || `Conoce el portafolio profesional de ${portfolio.name} en EthosHub.`;
    const url = window.location.href;
    const image = portfolio.photoUrl ?? '';

    document.title = title;
    setMeta('description', description);
    setMeta('og:type', 'profile'); setMeta('og:title', title); setMeta('og:description', description); setMeta('og:url', url);
    if (image) setMeta('og:image', image);
    setMeta('twitter:card', 'summary'); setMeta('twitter:title', title); setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);

    return () => {
      document.title = 'EthosHub';
      ['description','og:type','og:title','og:description','og:url','og:image','twitter:card','twitter:title','twitter:description','twitter:image'].forEach(removeMeta);
    };
  }, [portfolio]);
}

function setMeta(nameOrProp: string, content: string) {
  const isOg = nameOrProp.startsWith('og:') || nameOrProp.startsWith('twitter:');
  const attr = isOg ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${nameOrProp}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, nameOrProp); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function removeMeta(nameOrProp: string) {
  const isOg = nameOrProp.startsWith('og:') || nameOrProp.startsWith('twitter:');
  document.querySelector(`meta[${isOg ? 'property' : 'name'}="${nameOrProp}"]`)?.remove();
}

export default function PublicPortfolioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, profile } = useAuthStore();
  const [portfolio, setPortfolio] = useState<PublicPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwner = !!slug && !!profile?.slug && slug === profile.slug;

  useEffect(() => {
    if (!slug) { setLoading(false); setNotFound(true); return; }
    const fetch = isOwner ? portfolioService.getPreviewPortfolio() : portfolioService.getPublicPortfolio(slug);
    fetch.then(setPortfolio).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [slug, isOwner]);

  useSeoMeta(portfolio);

  if (loading)              return <PublicPortfolioSkeleton />;
  if (notFound || !portfolio) return <PortfolioNotFound slug={slug} />;

  return <PortfolioPublicView portfolio={portfolio} isGuest={!isAuthenticated} isOwner={isOwner} />;
}

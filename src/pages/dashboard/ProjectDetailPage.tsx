/**
 * ProjectDetailPage.tsx — Premium cinematic rewrite
 * Full technical case-study presentation experience
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Tag,
  User as ProfileIcon,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Play,
  FileText,
  BarChart3,
  Clock,
  ChevronRight,
  Layers,
  Activity,
} from 'lucide-react';
import { useProjectsStore } from '@/store';
import { Skeleton } from '@/shared/ui';
import type { ProjectFile, ProjectMedia } from '@/shared/types';
import { formatDate, cn, getYoutubeEmbedUrl, getVimeoEmbedUrl } from '@/shared/lib/utils';

/** GitHub mark SVG */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const STATUS_STYLES = {
  draft: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  archived: 'bg-muted text-muted-foreground border-border',
} as const;

const STATUS_LABELS = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  completed: 'Completado',
  archived: 'Archivado',
} as const;

const reorderMedia = (items: ProjectMedia[], from: number, to: number) => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

async function fetchFileSize(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const len = res.headers.get('content-length');
    const n = len ? Number(len) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
        <Icon className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {children}
      </span>
    </div>
  );
}

// ─── InfoTile ─────────────────────────────────────────────────────────────────

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-[13px] font-medium text-foreground leading-snug">{value}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentProject, loading, fetchProject, updateProject, clearCurrentProject } =
    useProjectsStore();

  const [mediaItems, setMediaItems] = useState<ProjectMedia[]>([]);
  const [fileItems, setFileItems] = useState<ProjectFile[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (projectId) fetchProject(projectId);
    return () => clearCurrentProject();
  }, [projectId, fetchProject, clearCurrentProject]);

  useEffect(() => {
    setMediaItems(currentProject?.media ?? []);
  }, [currentProject?.id, currentProject?.media]);

  useEffect(() => {
    if (!currentProject) return;
    setFileItems(currentProject.files);

    const missing = currentProject.files.filter((f) => !f.size || f.size <= 0);
    if (missing.length === 0) return;

    void Promise.all(missing.map(async (f) => ({ id: f.id, size: await fetchFileSize(f.url) }))).then(
      (sizes) => {
        setFileItems((cur) =>
          cur.map((f) => {
            const s = sizes.find((x) => x.id === f.id && x.size > 0);
            return s ? { ...f, size: s.size } : f;
          }),
        );
      },
    );
  }, [currentProject?.id, currentProject?.files]);

  const handleMediaDrop = (from: number, to: number) => {
    if (!currentProject || from === to) return;
    const next = reorderMedia(mediaItems, from, to);
    setMediaItems(next);
    void updateProject(currentProject.id, { media: next }, currentProject.profileId);
  };

  const getEmbedUrl = (url: string, type: string) => {
    if (type === 'youtube') return getYoutubeEmbedUrl(url);
    if (type === 'vimeo') return getVimeoEmbedUrl(url);
    return url;
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/50">
          <Layers className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-lg font-semibold text-foreground">Proyecto no encontrado</p>
        <p className="mt-1 text-sm text-muted-foreground">
          El proyecto no existe o no tienes acceso.
        </p>
        <button
          onClick={() => navigate('/dashboard/projects')}
          className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a proyectos
        </button>
      </div>
    );
  }

  const repoUrl = (currentProject as typeof currentProject & { repositoryUrl?: string })
    .repositoryUrl;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">
      {/* ── Breadcrumb nav ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/dashboard/projects"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Proyectos
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {currentProject.title}
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="space-y-6"
      >
        {/* ── Hero card ───────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Cover */}
          {currentProject.thumbnail ? (
            <div className="aspect-[21/7] overflow-hidden bg-muted">
              <img
                src={currentProject.thumbnail}
                alt={currentProject.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[21/7] items-center justify-center bg-gradient-to-br from-violet-950 via-violet-900/50 to-indigo-950">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
              <Layers className="h-12 w-12 text-violet-400/30" />
            </div>
          )}

          {/* Title area */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                {/* Badges row */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {currentProject.isFeatured && (
                    <span className="flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-yellow-600 dark:text-yellow-400">
                      <Star className="h-2.5 w-2.5 fill-current" /> Destacado
                    </span>
                  )}
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                      STATUS_STYLES[currentProject.status],
                    )}
                  >
                    {STATUS_LABELS[currentProject.status]}
                  </span>
                  <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {currentProject.category}
                  </span>
                  <span
                    className={cn(
                      'flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                      currentProject.isPublic
                        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                        : 'border-border bg-muted/40 text-muted-foreground',
                    )}
                  >
                    {currentProject.isPublic ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    {currentProject.isPublic ? 'Público' : 'Privado'}
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {currentProject.title}
                </h1>

                {currentProject.technicalInfo.role && (
                  <p className="mt-1.5 text-sm font-medium text-muted-foreground">
                    {currentProject.technicalInfo.role}
                  </p>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 sm:shrink-0">
                {repoUrl && (
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted hover:border-foreground/20 transition-all"
                  >
                    <GithubMark className="h-4 w-4" /> GitHub
                  </a>
                )}
              </div>
            </div>

            <p className="mt-4 text-[14px] leading-relaxed text-foreground/75">
              {currentProject.description}
            </p>

            {/* Timestamps */}
            <div className="mt-5 flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Creado: {formatDate(currentProject.createdAt)}
              </span>
              <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                Actualizado: {formatDate(currentProject.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Content grid ────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Tech info */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <SectionLabel icon={Tag}>Información técnica</SectionLabel>

              <div className="grid gap-3 sm:grid-cols-2">
                {currentProject.technicalInfo.role && (
                  <InfoTile icon={ProfileIcon} label="Rol" value={currentProject.technicalInfo.role} />
                )}
                {(currentProject.technicalInfo.startDate ||
                  currentProject.technicalInfo.endDate) && (
                  <InfoTile
                    icon={Clock}
                    label="Período"
                    value={
                      <>
                        {currentProject.technicalInfo.startDate
                          ? formatDate(currentProject.technicalInfo.startDate)
                          : '—'}
                        {currentProject.technicalInfo.endDate
                          ? ` → ${formatDate(currentProject.technicalInfo.endDate)}`
                          : ' → Presente'}
                      </>
                    }
                  />
                )}
              </div>

              {/* Technologies */}
              {currentProject.technicalInfo.technologies.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Stack tecnológico
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentProject.technicalInfo.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-[12px] font-medium text-violet-700 dark:text-violet-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Repository link */}
              {repoUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Repositorio
                  </p>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-[13px] text-foreground hover:bg-muted hover:border-foreground/20 transition-all group"
                  >
                    <GithubMark className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    <span className="truncate text-foreground/80 group-hover:text-foreground transition-colors">
                      {repoUrl}
                    </span>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  </a>
                </div>
              )}
            </div>

            {/* Results */}
            {currentProject.technicalInfo.results && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <SectionLabel icon={BarChart3}>Resultados e impacto</SectionLabel>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-[14px] leading-relaxed text-foreground/80">
                    {currentProject.technicalInfo.results}
                  </p>
                </div>
              </div>
            )}

            {/* Media */}
            {mediaItems.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <SectionLabel icon={Play}>Media y demos</SectionLabel>
                <div className="space-y-4">
                  {mediaItems.map((media, index) => (
                    <div
                      key={media.id}
                      draggable
                      onDragStart={() => setDraggedIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedIndex === null) return;
                        handleMediaDrop(draggedIndex, index);
                        setDraggedIndex(null);
                      }}
                      onDragEnd={() => setDraggedIndex(null)}
                      className="overflow-hidden rounded-xl border border-border bg-muted/10 transition-shadow cursor-grab active:cursor-grabbing hover:shadow-sm"
                    >
                      {(media.type === 'youtube' || media.type === 'vimeo') && (
                        <div className="aspect-video">
                          <iframe
                            src={getEmbedUrl(media.url, media.type)}
                            title={media.title}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {(media.type === 'figma' ||
                        media.type === 'slides' ||
                        media.type === 'document') && (
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                              <FileText className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                                {media.type}
                              </span>
                              <p className="mt-0.5 truncate text-[13px] text-foreground">
                                {media.title}
                              </p>
                            </div>
                          </div>
                          <a
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground/50">
                  Arrastra para reordenar
                </p>
              </div>
            )}
          </div>

          {/* Sidebar column */}
          <div className="space-y-5">
            {/* Project meta */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <SectionLabel icon={Layers}>Detalles del proyecto</SectionLabel>
              <dl className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <dt className="text-[12px] text-muted-foreground">Categoría</dt>
                  <dd className="text-[12px] font-medium text-foreground">{currentProject.category}</dd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <dt className="text-[12px] text-muted-foreground">Estado</dt>
                  <dd>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                        STATUS_STYLES[currentProject.status],
                      )}
                    >
                      {STATUS_LABELS[currentProject.status]}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <dt className="text-[12px] text-muted-foreground">Visibilidad</dt>
                  <dd className="flex items-center gap-1 text-[12px] font-medium text-foreground">
                    {currentProject.isPublic ? (
                      <>
                        <Eye className="h-3 w-3 text-emerald-500" /> Público
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" /> Privado
                      </>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <dt className="text-[12px] text-muted-foreground">Destacado</dt>
                  <dd className="text-[12px] font-medium text-foreground">
                    {currentProject.isFeatured ? (
                      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        <Star className="h-3 w-3 fill-current" /> Sí
                      </span>
                    ) : (
                      'No'
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <dt className="text-[12px] text-muted-foreground">Tecnologías</dt>
                  <dd className="text-[12px] font-medium tabular-nums text-foreground">
                    {currentProject.technicalInfo.technologies.length}
                  </dd>
                </div>
                {currentProject.media.length > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <dt className="text-[12px] text-muted-foreground">Media</dt>
                    <dd className="text-[12px] font-medium tabular-nums text-foreground">
                      {currentProject.media.length}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Files */}
            {fileItems.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <SectionLabel icon={FileText}>Documentos</SectionLabel>
                <div className="space-y-2">
                  {fileItems.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 hover:border-violet-500/20 transition-all group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                        <FileText className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {file.size > 0
                            ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                            : 'Documento'}
                        </p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Back to list */}
            <Link
              to="/dashboard/projects"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/30 py-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a proyectos
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

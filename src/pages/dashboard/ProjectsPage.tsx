/**
 * ProjectsPage.tsx — Premium refactor v5
 * - createPortal overlays contained in #portal-root (not full viewport)
 * - ProjectDetailModal: Edit + Delete actions in header and footer
 * - INITIAL_MOCK_PROJECTS: Project[] — exact Project interface; seeded into Zustand store on mount
 * - Optimistic CRUD: store updates local state before API call (works offline / with mock data)
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Star,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Calendar,
  FolderKanban,
  ExternalLink,
  X,
  ArrowRight,
  Tag,
  User,
  Clock,
  BarChart3,
  FileText,
  Play,
  Code2,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

/** GitHub mark SVG */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

import { useAuthStore, useProjectsStore, useUiStore } from '@/store';
import {
  Button,
  Select,
  Skeleton,
} from '@/shared/ui';
import { formatDate, cn } from '@/shared/lib/utils';
import type { Project, ProjectStatus } from '@/shared/types';
import { CreateProjectModal } from '@/features/projects/components/CreateProjectModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const getFullUrl = (url: string | undefined | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'draft',       label: 'Borrador'    },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'completed',   label: 'Completado'  },
  { value: 'archived',    label: 'Archivado'   },
];

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft:       'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  completed:   'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  archived:    'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft:       'Borrador',
  in_progress: 'En progreso',
  completed:   'Completado',
  archived:    'Archivado',
};

type ProjectSortOrder = 'featured_recent' | 'recent' | 'oldest' | 'name_asc' | 'name_desc';

const SORT_OPTIONS: { value: ProjectSortOrder; label: string }[] = [
  { value: 'featured_recent', label: 'Destacados primero' },
  { value: 'recent',          label: 'Más recientes'      },
  { value: 'oldest',          label: 'Más antiguos'       },
  { value: 'name_asc',        label: 'Nombre A–Z'         },
  { value: 'name_desc',       label: 'Nombre Z–A'         },
];

// ─── Initial mock data — exact Project interface, seeded into store on mount ──
//     hydrateForm() reads: technicalInfo.{role,technologies,startDate,endDate,results}
//     media[] and files[] — all fields required by CreateProjectModal

const INITIAL_MOCK_PROJECTS: Project[] = [
  {
    id:          'mock-1',
    userId:      'mock-profile',
    title:       'NexusAI Platform',
    category:    'Web',
    status:      'completed',
    isPublic:    true,
    isFeatured:  true,
    description:
      'Plataforma SaaS de inteligencia artificial para análisis predictivo empresarial. Integra pipelines de ML en tiempo real con dashboards adaptativos, API RESTful documentada con OpenAPI 3.1, y modelos fine-tuned sobre GPT-4 para procesamiento de lenguaje natural aplicado a datos corporativos estructurados y no estructurados.',
    /** gradient:<id> — resolveGradient() + CoverPresetSelector pre-select */
    thumbnail:     'gradient:violet-space',
    repositoryUrl: 'https://github.com/dpardo/nexusai-platform',
    technicalInfo: {
      role:         'Lead Full-Stack Engineer & ML Architect',
      technologies: ['Next.js 14', 'TypeScript', 'PostgreSQL', 'Docker', 'OpenAI', 'TailwindCSS', 'Prisma', 'Redis', 'FastAPI', 'Python 3.12'],
      startDate:    '2024-01-15',
      endDate:      '2024-09-30',
      results:
        'Reducción del 40% en tiempo de análisis predictivo vs. solución previa. Onboarding de 12 empresas en beta cerrada con NPS de 72. Cobertura de tests > 85%. Procesamiento de 450k llamadas API/día con p99 < 180ms. Reducción de costos de infraestructura del 28% mediante caching inteligente con Redis.',
    },
    media: [
      {
        id:        'mock-media-1',
        projectId: 'mock-1',
        url:       'https://www.youtube.com/embed/dQw4w9WgXcQ',
        type:      'youtube',
        title:     'Demo: NexusAI Dashboard Overview',
      },
    ],
    files: [
      {
        id:        'mock-file-1',
        projectId: 'mock-1',
        name:      'NexusAI_TechSpec_v2.pdf',
        type:      'pdf',
        size:      2457600,
        url:       'https://example.com/nexusai-spec.pdf',
      },
    ],
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-09-30T00:00:00.000Z',
  },
  {
    id:         'mock-2',
    userId:     'mock-profile',
    title:      'InfraEdge Orchestrator',
    category:   'DevOps',
    status:     'in_progress',
    isPublic:   true,
    isFeatured: false,
    description:
      'Plataforma de observabilidad distribuida para infraestructura cloud-native multi-región. Agrega métricas de AWS, GCP y Azure con alertas ML-driven, dashboards Grafana embebidos y correlación automática de incidentes. Incluye runbooks auto-generados con IA que reducen el MTTR de 45 a 8 minutos en producción.',
    /** gradient:<id> — resolveGradient() + CoverPresetSelector pre-select */
    thumbnail:     'gradient:cyber-teal',
    repositoryUrl: 'https://github.com/dpardo/infraedge-orchestrator',
    technicalInfo: {
      role:         'Platform Engineer & SRE Lead',
      technologies: ['Kubernetes', 'Go 1.22', 'Prometheus', 'Grafana', 'AWS', 'Terraform', 'ClickHouse', 'gRPC', 'Istio', 'ArgoCD'],
      startDate:    '2024-03-01',
      endDate:      '',
      results:
        'MTTR reducido de 45 min a 8 min en producción. Integración con 4 cloud providers (AWS, GCP, Azure, OCI). Alertas predictivas con 92% de precisión sobre 50k events/sec. Gestión activa de 38 clusters Kubernetes con SLA 99.95%.',
    },
    media: [
      {
        id:        'mock-media-2',
        projectId: 'mock-2',
        url:       'https://player.vimeo.com/video/123456789',
        type:      'vimeo',
        title:     'InfraEdge: Live Architecture Walkthrough',
      },
    ],
    files: [
      {
        id:        'mock-file-2a',
        projectId: 'mock-2',
        name:      'InfraEdge_Architecture_v3.pdf',
        type:      'pdf',
        size:      3670016,
        url:       'https://example.com/infraedge-arch.pdf',
      },
      {
        id:        'mock-file-2b',
        projectId: 'mock-2',
        name:      'SRE_Runbook_Playbook.pdf',
        type:      'pdf',
        size:      1536000,
        url:       'https://example.com/infraedge-runbook.pdf',
      },
    ],
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2025-05-27T00:00:00.000Z',
  },
];

// ─── Gradient cover map (mirrors CreateProjectModal PREDEFINED_COVERS) ─────────

const GRADIENT_MAP: Record<string, string> = {
  'gradient:violet-space':  'linear-gradient(135deg, #1A0530 0%, #0D0820 50%, #05050D 100%)',
  'gradient:cyber-teal':    'linear-gradient(135deg, #002E3A 0%, #001A24 50%, #000C12 100%)',
  'gradient:ember-dark':    'linear-gradient(135deg, #1C0A00 0%, #0F0400 50%, #060000 100%)',
  'gradient:matrix-green':  'linear-gradient(135deg, #001A0D 0%, #000E06 50%, #000402 100%)',
  'gradient:midnight-blue': 'linear-gradient(135deg, #00082A 0%, #000318 50%, #000009 100%)',
  'gradient:rose-dark':     'linear-gradient(135deg, #1C0012 0%, #0E0008 50%, #040002 100%)',
};

const resolveGradient = (thumbnail: string) =>
  GRADIENT_MAP[thumbnail] ?? 'linear-gradient(135deg, #1A0530 0%, #0E0E1C 100%)';

// ─── Sort helper ──────────────────────────────────────────────────────────────

const getTs = (p: Project) => {
  const t = new Date(p.updatedAt || p.createdAt).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const sortProjects = (list: Project[], order: ProjectSortOrder) =>
  [...list].sort((a, b) => {
    if (order === 'recent') return getTs(b) - getTs(a);
    if (order === 'oldest') return getTs(a) - getTs(b);
    if (order === 'name_asc') return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    if (order === 'name_desc') return b.title.localeCompare(a.title, 'es', { sensitivity: 'base' });
    if (a.isFeatured !== b.isFeatured) return Number(b.isFeatured) - Number(a.isFeatured);
    return getTs(b) - getTs(a);
  });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { user: profile } = useAuthStore();
  const { addToast } = useUiStore();
  const { projects, loading, fetchProjects, deleteProject } = useProjectsStore();

  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [editingProject, setEditingProject]     = useState<Project | null>(null);
  const [selectedProject, setSelectedProject]   = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm]       = useState<string | null>(null);
  const [filterStatus, setFilterStatus]         = useState<string>('all');
  const [sortOrder, setSortOrder]               = useState<ProjectSortOrder>('featured_recent');

  // Fetch real projects; if API returns empty, seed store with typed mock data
  useEffect(() => {
    const init = async () => {
      if (profile?.profile_id) await fetchProjects(profile.profile_id);
      // After fetch (success or fail) — seed with mock data when store is still empty
      if (useProjectsStore.getState().projects.length === 0) {
        useProjectsStore.setState({ projects: INITIAL_MOCK_PROJECTS, loading: false });
      }
    };
    void init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.profile_id]);

  const openEditModal = (project: Project) => {
    setEditingProject(project);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const targetId = deleteConfirm;
    setDeleteConfirm(null);
    if (selectedProject?.id === targetId) setSelectedProject(null);
    await deleteProject(targetId);
    addToast({ type: 'success', title: 'Proyecto eliminado' });
  };

  const filtered = sortProjects(
    filterStatus === 'all' ? projects : projects.filter((p) => p.status === filterStatus),
    sortOrder,
  );

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
        <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6 lg:items-center">
          {/* Col left: badge · title · description */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Code2 className="h-3 w-3 text-primary" />
              Catálogo Técnico
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Proyectos y Evidencias.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gestiona tu catálogo de proyectos y evidencias técnicas.
            </p>
          </div>
          {/* Col right: 2×2 grid — filters top, counter+button bottom */}
          <div className="grid grid-cols-2 gap-2.5">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[{ value: 'all', label: 'Todos los estados' }, ...PROJECT_STATUSES]}
              className="h-10 w-full text-sm"
            />
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as ProjectSortOrder)}
              options={SORT_OPTIONS}
              className="h-10 w-full text-sm"
            />
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="flex h-10 items-center gap-2 rounded-2xl border border-border bg-background/80 px-3 backdrop-blur"
            >
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-sm font-bold text-foreground tabular-nums leading-none">{filtered.length}</span>
              <span className="truncate whitespace-nowrap overflow-hidden text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {filtered.length === 1 ? 'Proyecto' : 'Proyectos'}
              </span>
            </motion.div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-10 w-full gap-2"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">
                {t('projects.addProject', 'Agregar proyecto')}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[340px] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <motion.div
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
          }}
        >
          {filtered.map((project) => (
            <motion.div
              key={project.id}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.97 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } },
              }}
            >
              <ProjectCard
                project={project}
                onClick={() => setSelectedProject(project)}
                onEdit={(e) => { e.stopPropagation(); openEditModal(project); }}
                onDelete={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <MockEmptyState onAdd={() => setShowCreateModal(true)} />
      )}

      {/* ── Project Detail Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onEdit={() => {
              setSelectedProject(null);
              openEditModal(selectedProject);
            }}
            onDelete={() => {
              setSelectedProject(null);
              setDeleteConfirm(selectedProject.id);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <CreateProjectModal
        isOpen={!!editingProject}
        project={editingProject}
        onClose={() => setEditingProject(null)}
      />
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteProjectConfirmModal
            onClose={() => setDeleteConfirm(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onClick,
  onEdit,
  onDelete,
}: {
  project: Project;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const tech = project.technicalInfo.technologies;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm',
        'border-border hover:border-violet-500/40',
        'transition-shadow duration-300',
        'hover:shadow-[0_8px_32px_rgba(124,58,237,0.18)] dark:hover:shadow-[0_8px_32px_rgba(139,92,246,0.13)]',
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[16/7] overflow-hidden bg-muted">
        {project.thumbnail?.startsWith('gradient:') ? (
          <div
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: resolveGradient(project.thumbnail) }}
          >
            {/* Grid texture */}
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>
        ) : project.thumbnail ? (
          <img
            src={getFullUrl(project.thumbnail)}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-muted/40">
            <FolderKanban className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}
        {/* Hover tint */}
        <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/[0.03] transition-colors duration-300" />
        {/* Explore hint */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm">
          Ver detalle <ArrowRight className="h-2.5 w-2.5" />
        </div>
        {project.isFeatured && (
          <div className="absolute left-3 top-3">
            <span className="flex items-center gap-1 rounded-full border border-yellow-400/30 bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-yellow-300 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5 fill-current" /> Destacado
            </span>
          </div>
        )}
        <div className="absolute right-3 top-3">
          <span
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm',
              project.isPublic
                ? 'border-emerald-500/30 bg-black/40 text-emerald-300'
                : 'border-white/10 bg-black/40 text-white/50',
            )}
          >
            {project.isPublic ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
            {project.isPublic ? 'Público' : 'Privado'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', STATUS_STYLES[project.status])}>
            {STATUS_LABELS[project.status]}
          </span>
          <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {project.category}
          </span>
        </div>

        <h3 className="text-[15px] font-semibold leading-snug text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
          {project.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        {tech.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tech.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-foreground/70"
              >
                {t}
              </span>
            ))}
            {tech.length > 4 && (
              <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                +{tech.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(project.updatedAt)}
          </span>
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Link to={`/dashboard/projects/${project.id}`}>
              <button
                title="Vista completa"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </Link>
            <button
              title="Editar"
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              title="Eliminar"
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ProjectDetailModal — contained in #portal-root ──────────────────────────

type DetailTab = 'overview' | 'technical' | 'media' | 'files';

function ProjectDetailModal({
  project,
  onClose,
  onEdit,
  onDelete,
}: {
  project: Project;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tech    = project.technicalInfo.technologies;
  const repoUrl = project.repositoryUrl;
  const [tab, setTab] = useState<DetailTab>('overview');

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview',  label: 'Resumen',    icon: Layers   },
    { id: 'technical', label: 'Técnico',    icon: Code2    },
    { id: 'media',     label: 'Media',      icon: Play     },
    { id: 'files',     label: 'Documentos', icon: FileText },
  ];

  const hasMedia = project.media.length > 0;
  const hasFiles = project.files.length > 0;

  const portalRoot = document.getElementById('portal-root') ?? document.body;
  return createPortal(
    <>
      {/* Backdrop — absolute, contained within #portal-root (content area only) */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-[80] bg-background/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal panel — absolute, contained within content area */}
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
        {/* Accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-violet-700 via-violet-500 to-violet-300 shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 shrink-0 border-b border-border">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', STATUS_STYLES[project.status])}>
                {STATUS_LABELS[project.status]}
              </span>
              <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {project.category}
              </span>
              {project.isFeatured && (
                <span className="flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-600 dark:text-yellow-400">
                  <Star className="h-2.5 w-2.5 fill-current" /> Destacado
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold leading-tight text-foreground sm:text-xl">{project.title}</h2>
            {project.technicalInfo.role && (
              <p className="mt-0.5 text-[13px] text-muted-foreground">{project.technicalInfo.role}</p>
            )}
          </div>
          {/* Header actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              title="Editar proyecto"
              className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-[12px] font-medium text-muted-foreground hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </button>
            <button
              onClick={onDelete}
              title="Eliminar proyecto"
              className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 text-[12px] font-medium text-muted-foreground hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Cover */}
          {project.thumbnail && (
            <div className="aspect-[21/7] overflow-hidden bg-muted">
              {project.thumbnail.startsWith('gradient:') ? (
                <div
                  className="relative h-full w-full"
                  style={{ backgroundImage: resolveGradient(project.thumbnail) }}
                >
                  <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                </div>
              ) : (
                <img
                  src={getFullUrl(project.thumbnail)}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-6">

            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Description */}
                <div>
                  <SectionLabel icon={FileText}>Descripción</SectionLabel>
                  <p className="text-[14px] leading-relaxed text-foreground/80">
                    {project.description}
                  </p>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {project.technicalInfo.role && (
                    <InfoTile icon={User} label="Rol" value={project.technicalInfo.role} />
                  )}
                  {(project.technicalInfo.startDate || project.technicalInfo.endDate) && (
                    <InfoTile
                      icon={Clock}
                      label="Período"
                      value={
                        <>
                          {project.technicalInfo.startDate ? formatDate(project.technicalInfo.startDate) : '—'}
                          {project.technicalInfo.endDate
                            ? ` → ${formatDate(project.technicalInfo.endDate)}`
                            : ' → Presente'}
                        </>
                      }
                    />
                  )}
                  <InfoTile
                    icon={Eye}
                    label="Visibilidad"
                    value={project.isPublic ? 'Público' : 'Privado'}
                  />
                  <InfoTile
                    icon={Calendar}
                    label="Actualizado"
                    value={formatDate(project.updatedAt)}
                  />
                </div>

                {/* Results */}
                {project.technicalInfo.results && (
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10">
                        <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                        Resultados e impacto
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-foreground/80">
                      {project.technicalInfo.results}
                    </p>
                  </div>
                )}

                {/* Visibility + Featured badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium',
                    project.isPublic
                      ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                      : 'border-border bg-muted/40 text-muted-foreground',
                  )}>
                    {project.isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {project.isPublic ? 'Público' : 'Privado'}
                  </span>
                  {project.isFeatured && (
                    <span className="flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[12px] font-semibold text-yellow-600 dark:text-yellow-400">
                      <Star className="h-3 w-3 fill-current" /> Proyecto destacado
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── TECHNICAL TAB ── */}
            {tab === 'technical' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Stack */}
                {tech.length > 0 && (
                  <div>
                    <SectionLabel icon={Tag}>Stack tecnológico</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {tech.map((t) => (
                        <span
                          key={t}
                          className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-3 py-1.5 text-[12px] font-medium text-violet-700 dark:text-violet-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repository */}
                {repoUrl && (
                  <div>
                    <SectionLabel icon={GithubMark}>Repositorio</SectionLabel>
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-[13px] text-foreground hover:bg-muted hover:border-foreground/20 transition-all group"
                    >
                      <GithubMark className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      <span className="truncate text-foreground/80 group-hover:text-foreground transition-colors flex-1">
                        {repoUrl}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    </a>
                  </div>
                )}

                {/* Timeline */}
                {(project.technicalInfo.startDate || project.technicalInfo.endDate) && (
                  <div>
                    <SectionLabel icon={Activity}>Timeline</SectionLabel>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-[13px] text-foreground">
                        {project.technicalInfo.startDate ? formatDate(project.technicalInfo.startDate) : '—'}
                        {' '}<ChevronRight className="inline h-3.5 w-3.5 text-muted-foreground/50" />{' '}
                        {project.technicalInfo.endDate ? formatDate(project.technicalInfo.endDate) : 'Presente'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Results */}
                {project.technicalInfo.results && (
                  <div>
                    <SectionLabel icon={BarChart3}>Resultados obtenidos</SectionLabel>
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-[13px] leading-relaxed text-foreground/80">
                        {project.technicalInfo.results}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── MEDIA TAB ── */}
            {tab === 'media' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {hasMedia ? (
                  project.media.map((m) => (
                    <div key={m.id} className="overflow-hidden rounded-xl border border-border bg-muted/10">
                      {(m.type === 'youtube' || m.type === 'vimeo') && (
                        <div className="aspect-video">
                          <iframe
                            src={m.url}
                            title={m.title}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {(m.type === 'figma' || m.type === 'slides' || m.type === 'document') && (
                        <div className="flex items-center justify-between p-3.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground shrink-0">
                              {m.type}
                            </span>
                            <span className="truncate text-[13px] text-foreground">{m.title}</span>
                          </div>
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <EmptyTabState
                    icon={Play}
                    title="Sin media"
                    description="Agrega videos, demos de Figma o presentaciones al editar este proyecto."
                  />
                )}
              </motion.div>
            )}

            {/* ── FILES TAB ── */}
            {tab === 'files' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {hasFiles ? (
                  project.files.map((f) => (
                    <a
                      key={f.id}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3.5 hover:bg-muted/40 hover:border-violet-500/20 transition-all group"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                        <FileText className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {f.size > 0 ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : 'Documento'}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </a>
                  ))
                ) : (
                  <EmptyTabState
                    icon={FileText}
                    title="Sin documentos"
                    description="Agrega PDFs o documentos al editar este proyecto."
                  />
                )}
              </motion.div>
            )}

          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex items-center gap-2 border-t border-border bg-background/80 px-5 py-3.5 backdrop-blur-sm shrink-0 flex-wrap">
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-2.5 text-[13px] font-medium text-foreground hover:bg-muted hover:border-foreground/20 transition-all"
            >
              <GithubMark className="h-4 w-4" /> Repositorio
            </a>
          )}
          <Link
            to={`/dashboard/projects/${project.id}`}
            className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 py-2.5 text-[13px] font-semibold text-white transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Vista completa
          </Link>
          {/* Mobile-only actions */}
          <button
            onClick={onEdit}
            className="sm:hidden flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-[13px] font-medium text-muted-foreground hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            onClick={onDelete}
            className="sm:hidden flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-500/15 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      </motion.div>
    </>,
    portalRoot,
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/10">
        <Icon className="h-3 w-3 text-violet-600 dark:text-violet-400" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {children}
      </span>
    </div>
  );
}

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
    <div className="rounded-xl border border-border bg-muted/30 p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-[13px] font-medium text-foreground leading-snug">{value}</div>
    </div>
  );
}

function EmptyTabState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
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

// ─── DeleteProjectConfirmModal — contained in #portal-root ───────────────────

function DeleteProjectConfirmModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const portalRoot = document.getElementById('portal-root') ?? document.body;
  return createPortal(
    <>
      {/* Backdrop — absolute, contained within #portal-root (content area only) */}
      <motion.div
        key="del-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute inset-0 z-[90] bg-background/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div className="absolute inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="del-panel"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-6 shadow-2xl shadow-black/20"
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 pt-0.5">
              <h2 className="text-[15px] font-semibold text-foreground">Eliminar proyecto</h2>
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                ¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 justify-end">
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-muted/40 px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="rounded-xl bg-red-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-600 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </motion.div>
      </div>
    </>,
    portalRoot,
  );
}

// ─── MockEmptyState ───────────────────────────────────────────────────────────

function MockEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/50">
        <FolderKanban className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Sin proyectos</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        No hay proyectos que coincidan con los filtros seleccionados. Crea uno nuevo o ajusta los criterios.
      </p>
      <Button onClick={onAdd} className="mt-5 gap-2">
        <Plus className="h-4 w-4" /> Crear nuevo proyecto
      </Button>
    </div>
  );
}


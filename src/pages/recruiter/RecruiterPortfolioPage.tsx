import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FolderKanban, Star, ExternalLink,
  Calendar, Code2, Lock
} from 'lucide-react';
import { Button, Badge, Skeleton } from '@/shared/ui';
import api from '@/shared/api/api';

interface PublicProject {
  projectId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  repositoryUrl: string | null;
  isFeatured: boolean;
  createdAt: string;
  technologies: string[];
  mediaContent: unknown[];
  category: string | null;
  status: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  results: string | null;
}

function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `/${url.replace(/^\//, '')}`;
}

function ProjectEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center dark:border-white/10 dark:bg-zinc-950"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-500/10">
        <FolderKanban className="h-8 w-8 text-violet-500" />
      </div>
      <h3 className="font-sans text-lg font-semibold text-black dark:text-white">
        Portafolio en construcción
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Este profesional aún no ha publicado proyectos en su portafolio.
      </p>
    </motion.div>
  );
}

function ProjectCard({ project, profileId, index }: {
  project: PublicProject;
  profileId: string;
  index: number;
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-violet-500/50 hover:shadow-lg dark:border-white/10 dark:bg-zinc-950"
    >
      {/* Thumbnail */}
      {project.thumbnailUrl ? (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={resolveImageUrl(project.thumbnailUrl) || ''}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {project.isFeatured && (
            <div className="absolute left-3 top-3">
              <span className="flex items-center gap-1 rounded-full bg-yellow-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
                <Star className="h-3 w-3 fill-white" />
                Destacado
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-500/5 dark:to-purple-500/5">
          {project.isFeatured && (
            <div className="absolute left-3 top-3">
              <span className="flex items-center gap-1 rounded-full bg-yellow-500 px-2.5 py-1 text-xs font-semibold text-white">
                <Star className="h-3 w-3 fill-white" />
                Destacado
              </span>
            </div>
          )}
          <FolderKanban className="h-10 w-10 text-violet-300 dark:text-violet-500/50" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-sans text-base font-bold text-black dark:text-white line-clamp-1">
          {project.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {project.description || 'Sin descripción'}
        </p>

        {/* Technologies */}
        {project.technologies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-400"
              >
                <Code2 className="h-3 w-3 text-violet-500" />
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="text-xs text-gray-400">+{project.technologies.length - 4}</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/5">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            {project.createdAt ? new Date(project.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }) : ''}
          </span>
          <Button
            onClick={() => navigate(`/recruiter/talent/${profileId}/portfolio/${project.projectId}`)}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-violet-700 hover:to-purple-700"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Ver detalle
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function RecruiterPortfolioPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    api.get(`/v1/projects/public/${profileId}`)
      .then(res => setProjects(res.data.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [profileId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/95 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <button
            onClick={() => navigate('/recruiter/talent-discovery')}
            className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-black dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <h1 className="font-sans text-base font-semibold text-black dark:text-white">
            Portafolio de Proyectos
          </h1>
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
            {projects.length} proyectos
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <ProjectEmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                profileId={profileId!}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
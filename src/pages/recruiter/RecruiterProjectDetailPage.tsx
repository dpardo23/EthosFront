import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Code2, ExternalLink,
  Calendar, Lock, Youtube, Figma, MonitorPlay, FileText
} from 'lucide-react';
import { Badge, Skeleton } from '@/shared/ui';
import api from '@/shared/api/api';

interface MediaItem {
  id: string;
  url: string;
  type: 'youtube' | 'vimeo' | 'figma' | 'slides' | 'image' | 'pdf' | 'document';
  title: string;
  size?: number | null;
}

interface ProjectDetail {
  projectId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  repositoryUrl: string | null;
  isFeatured: boolean;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  technologies: string[];
  mediaContent: MediaItem[];
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

function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center px-6 py-24 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
        <Lock className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="font-sans text-2xl font-bold text-black dark:text-white">
        Acceso Denegado
      </h2>
      <p className="mt-3 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Este proyecto está configurado como privado. El profesional no ha autorizado su visualización pública.
      </p>
      <button
        onClick={onBack}
        className="mt-8 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-violet-500 hover:text-violet-600 dark:border-white/10 dark:bg-zinc-950 dark:text-gray-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al portafolio
      </button>
    </motion.div>
  );
}

function getEmbedUrl(url: string, type: string) {
  if (type === 'youtube') {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }
  if (type === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : url;
  }
  return url;
}

function MediaIcon({ type }: { type: string }) {
  if (type === 'youtube') return <Youtube className="h-4 w-4 text-red-500" />;
  if (type === 'figma') return <Figma className="h-4 w-4 text-violet-500" />;
  if (type === 'pdf' || type === 'document') return <FileText className="h-4 w-4 text-red-400" />;
  return <MonitorPlay className="h-4 w-4 text-blue-500" />;
}

function formatFileSize(size?: number | null) {
  if (!size || size <= 0) return '';
  const sizeInMb = size / 1024 / 1024;
  return `${sizeInMb.toFixed(2)} MB`;
}

async function fetchRemoteFileSize(url: string): Promise<number> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    const parsedSize = contentLength ? Number(contentLength) : 0;
    return Number.isFinite(parsedSize) ? parsedSize : 0;
  } catch {
    return 0;
  }
}

function getExtensionFromUrlOrType(url: string, type: string) {
  try {
    const parsed = new URL(url, window.location.origin);
    const match = parsed.pathname.match(/\.([a-z0-9]+)(?:$|\?)/i);
    if (match) return match[1];
  } catch (e) {
    // ignore
  }
  if (type === 'pdf') return 'pdf';
  if (type === 'document') return 'docx';
  return '';
}

async function handleDownload(media: MediaItem) {
  const url = resolveImageUrl(media.url) || media.url;
  if (!url) return;
  const baseName = (media.title || 'download').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
  const ext = getExtensionFromUrlOrType(url, media.type);
  const filename = ext ? `${baseName}.${ext}` : baseName;

  try {
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) throw new Error('Network response was not ok');
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    window.open(url, '_blank', 'noopener');
  }
}

export default function RecruiterProjectDetailPage() {
  const { profileId, projectId } = useParams<{ profileId: string; projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activePdf, setActivePdf] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!profileId || !projectId) return;
    setLoading(true);
    api.get(`/v1/projects/public/${profileId}/${projectId}`)
      .then(res => {
        if (res.data.status === 403) { setAccessDenied(true); return; }
        setProject(res.data.data);
      })
      .catch(err => {
        if (err.response?.status === 403) setAccessDenied(true);
      })
      .finally(() => setLoading(false));
  }, [profileId, projectId]);

  useEffect(() => {
    setMediaItems(project?.mediaContent ?? []);
  }, [project?.projectId, project?.mediaContent]);

  useEffect(() => {
    if (!project?.mediaContent?.length) return;

    const missingSizeItems = project.mediaContent.filter(
      (media) => (media.type === 'pdf' || media.type === 'document') && (!media.size || media.size <= 0),
    );

    if (missingSizeItems.length === 0) return;

    void Promise.all(
      missingSizeItems.map(async (media) => ({
        id: media.id,
        size: await fetchRemoteFileSize(resolveImageUrl(media.url) || media.url),
      })),
    ).then((resolvedSizes) => {
      setMediaItems((currentItems) =>
        currentItems.map((media) => {
          const resolved = resolvedSizes.find((item) => item.id === media.id && item.size > 0);
          return resolved ? { ...media, size: resolved.size } : media;
        }),
      );
    });
  }, [project?.mediaContent]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (accessDenied) {
    return <AccessDenied onBack={() => navigate(`/recruiter/talent/${profileId}/portfolio`)} />;
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500">Proyecto no encontrado</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-violet-600 underline">Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-zinc-950/95 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <button
            onClick={() => navigate(`/recruiter/talent/${profileId}/portfolio`)}
            className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-black dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al portafolio
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6"
      >
        {/* Thumbnail */}
        {project.thumbnailUrl && (
          <div className="aspect-video overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10">
            <img src={resolveImageUrl(project.thumbnailUrl) || ''} alt={project.title} className="h-full w-full object-cover" />
          </div>
        )}

        {/* Title & Badges */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="flex flex-wrap items-start gap-3">
            {project.isFeatured && (
              <span className="flex items-center gap-1 rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-white">
                <Star className="h-3 w-3 fill-white" />
                Destacado
              </span>
            )}
          </div>
          <h1 className="mt-3 font-sans text-2xl font-bold text-black dark:text-white">
            {project.title}
          </h1>
          <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-400">
            {project.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Creado: {project.createdAt ? new Date(project.createdAt).toLocaleDateString('es-ES', { dateStyle: 'medium' }) : '—'}
            </span>
            {project.updatedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Actualizado: {new Date(project.updatedAt).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
              </span>
            )}
          </div>
        </div>

        {/* Technologies */}
        {project.technologies.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-gray-400">
              Tecnologías
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map(tech => (
                <span
                  key={tech}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                >
                  <Code2 className="h-3.5 w-3.5 text-violet-500" />
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Información del proyecto */}
        {(project.role || project.category || project.status || project.startDate || project.results) && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
           <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-gray-400">
             Información del Proyecto
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
           {project.role && (
             <div>
               <p className="text-xs text-gray-400">Rol</p>
                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">{project.role}</p>
              </div>
           )}
           {project.category && (
             <div>
                <p className="text-xs text-gray-400">Categoría</p>
                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">{project.category}</p>
              </div>
            )}
            {project.status && (
              <div>
               <p className="text-xs text-gray-400">Estado</p>
               <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">{{ draft: 'Borrador', 
                in_progress: 'En progreso', completed: 'Completado', archived: 'Archivado' }[project.status] ?? project.status}</p>
              </div>
           )}
           {project.startDate && (
             <div>
                <p className="text-xs text-gray-400">Fecha inicio</p>
                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                 {new Date(project.startDate).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
               </p>
              </div>
            )}
           {project.endDate && (
             <div>
               <p className="text-xs text-gray-400">Fecha fin</p>
               <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                 {new Date(project.endDate).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
               </p>
              </div>
           )}
          </div>
         {project.results && (
           <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/5">
              <p className="text-xs text-gray-400">Resultados</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{project.results}</p>
            </div>
         )}
         </div>
      )}

        {/* Repository */}
        {project.repositoryUrl && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-gray-400">
              Repositorio
            </h2>
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400"
            >
              <ExternalLink className="h-4 w-4" />
              {project.repositoryUrl}
            </a>
          </div>
        )}

        {/* Media */}
        {project.mediaContent && project.mediaContent.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="mb-4 font-sans text-sm font-bold uppercase tracking-wider text-gray-400">
              Contenido Multimedia
            </h2>
            <div className="space-y-4">
              {mediaItems.map((media, index) => (
                <div key={media.id || index} className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">

                  {/* YouTube o Vimeo — embed */}
                  {(media.type === 'youtube' || media.type === 'vimeo') && (
                    <div className="aspect-video">
                      <iframe
                        src={getEmbedUrl(media.url, media.type)}
                        title={media.title || 'Video'}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* Imagen — mostrar inline */}
                  {media.type === 'image' && (
                    <img
                      src={resolveImageUrl(media.url) || ''}
                      alt={media.title || 'Imagen'}
                      className="h-auto w-full object-cover"
                    />
                  )}

                  {/* PDF — previsualizar + descargar */}
                  {(media.type === 'pdf' || media.type === 'document') && (
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-500" />
                        <div className="min-w-0">
                          <span className="block truncate max-w-xs text-sm text-gray-700 dark:text-gray-300">
                            {media.title || (media.type === 'document' ? 'Documento Word' : 'Documento PDF')}
                          </span>
                          {formatFileSize(media.size) && (
                            <span className="block text-xs text-gray-400 dark:text-gray-500">
                              {formatFileSize(media.size)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {media.type === 'pdf' && (
                          <button
                            onClick={() => setActivePdf(resolveImageUrl(media.url) || '')}
                            className="flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ver
                          </button>
                        )}
                        <button
                          onClick={() => void handleDownload(media)}
                          className="flex items-center gap-1 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Descargar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Figma o Slides */}
                  {(media.type === 'figma' || media.type === 'slides') && (
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-2">
                        <MediaIcon type={media.type} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {media.title || media.type}
                        </span>
                      </div>
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir
                      </a>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal PDF */}
      {activePdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/10">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Vista previa del documento
              </span>
              <button
                onClick={() => setActivePdf(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <iframe
              src={activePdf}
              className="flex-1 w-full"
              title="Vista previa PDF"
            />
          </div>
        </div>
      )}
    </div>
  );
}
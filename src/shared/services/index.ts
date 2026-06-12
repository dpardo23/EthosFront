import { generateId } from '../lib/utils';
import type {
  Project,
  ProjectMedia,
  ProjectCategory,
  ProjectStatus,
  HardSkill,
  SoftSkill,
  GlobalSkillTag,
  SkillLevel,
  OAuthConnection,
  GithubRepository,
} from '../types';

/**
 * Real API service adapters (skills, projects, connections) backed by the
 * Spring backend. Auth, portfolio, preferences and notifications live in
 * their own dedicated service modules.
 */
// Misma convención que el cliente axios (src/shared/api/api.ts): la base SIEMPRE
// incluye /api. En dev VITE_API_URL apunta a .../api; en prod queda vacío y se usa
// la ruta relativa '/api' (el JAR sirve /api y Vite proxea /api en dev).
// Por tanto, las rutas de las funciones de este archivo NO deben incluir /api.
const API_BASE_URL = ((import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api') as string)
  .replace(/\/$/, '');

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  try {
    const token = localStorage.getItem('ethoshub_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("No se pudo inyectar el token", e);
  }
  return headers;
}

interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  errors?: string[];
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> || {}),
      }),
    });
    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || 'Request failed');
    }
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
}

// =============================================
// SKILLS SERVICE

export const skillsService = {
  async searchTags(query: string): Promise<GlobalSkillTag[]> {
    const path = query ? `/skills/tags?query=${encodeURIComponent(query)}` : '/skills/tags';
    return apiRequest<GlobalSkillTag[]>(path);
  },

  async getHardSkills(profileId: string): Promise<HardSkill[]> {
    return apiRequest<HardSkill[]>(`/profiles/${profileId}/skills/hard`);
  },

  async addHardSkill(
    profileId: string,
    tagId: string,
    level: SkillLevel
  ): Promise<HardSkill> {
    return apiRequest<HardSkill>(`/profiles/${profileId}/skills/hard`, {
      method: 'POST',
      body: JSON.stringify({ tagId, level }),
    });
  },

  async createTag(name: string, category: string): Promise<GlobalSkillTag> {
    return apiRequest<GlobalSkillTag>('/skills/tags', {
      method: 'POST',
      body: JSON.stringify({ name, category }),
    });
  },

  async updateHardSkill(skillId: string, level: SkillLevel, tagId: string): Promise<HardSkill> {
    return apiRequest<HardSkill>(`/skills/hard/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify({ tagId, level }),
    });
  },

  async removeHardSkill(skillId: string): Promise<void> {
    await apiRequest<void>(`/skills/hard/${skillId}`, {
      method: 'DELETE',
    });
  },

  async toggleTopSkill(skillId: string): Promise<HardSkill> {
    return apiRequest<HardSkill>(`/skills/hard/${skillId}/top`, {
      method: 'PATCH',
    });
  },

  async toggleEndorsement(skillId: string, endorserId: string, endorserName: string, endorserAvatar: string): Promise<void> {
    await apiRequest<HardSkill>(`/skills/hard/${skillId}/endorsements/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ endorserId, endorserName, endorserAvatar }),
    });
  },

  async reorderTopSkills(profileId: string, skillIds: string[]): Promise<HardSkill[]> {
    return apiRequest<HardSkill[]>(`/profiles/${profileId}/skills/hard/top-order`, {
      method: 'PATCH',
      body: JSON.stringify({ skillIds }),
    });
  },

  async getSoftSkills(profileId: string): Promise<SoftSkill[]> {
    return apiRequest<SoftSkill[]>(`/profiles/${profileId}/skills/soft`);
  },

  async addSoftSkill(profileId: string, title: string, description?: string): Promise<SoftSkill> {
    return apiRequest<SoftSkill>(`/profiles/${profileId}/skills/soft`, {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  async updateSoftSkill(skillId: string, title: string, description?: string): Promise<SoftSkill> {
    return apiRequest<SoftSkill>(`/skills/soft/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description }),
    });
  },

  async removeSoftSkill(skillId: string): Promise<void> {
    await apiRequest<void>(`/skills/soft/${skillId}`, {
      method: 'DELETE',
    });
  },

  async getAllTags(): Promise<GlobalSkillTag[]> {
    return apiRequest<GlobalSkillTag[]>('/skills/tags/all');
  },
};

// =============================================
// PROJECTS SERVICE 

interface BackendMediaDTO {
  type: string;
  url: string;
  title?: string | null;
  size?: number | null;
}

interface BackendProjectDTO {
  projectId: string;
  profileId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  repositoryUrl: string | null;
  isFeatured: boolean;
  visibility: string;
  media: BackendMediaDTO[];
  createdAt: string | null;
  updatedAt: string | null;
  // ── Campos nuevos que ya devuelve el backend ──
  category: string | null;
  status: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  results: string | null;
  technologies: string[] | null;
}

const allowedMediaTypes = new Set(['youtube', 'vimeo', 'figma', 'slides', 'document', 'link']);

const STATUS_LABEL_TO_RAW: Record<string, string> = {
  'Borrador': 'draft',
  'En progreso': 'in_progress',
  'Completado': 'completed',
  'Archivado': 'archived',
};

function toRawStatus(value: string | undefined | null): string {
  if (!value) return 'draft';
  // Si ya es un valor raw lo devolvemos tal cual
  if (['draft', 'in_progress', 'completed', 'archived'].includes(value)) return value;
  return STATUS_LABEL_TO_RAW[value] ?? 'draft';
}

function resolveAssetUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('gradient:')) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

function normalizeUploadedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    // API_BASE_URL puede ser '' en modo monolito → usar origin como base de resolución
    const base = API_BASE_URL || window.location.origin;
    const parsed = new URL(url, base);
    const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    const host = parsed.hostname;
    if (isHttp && (host === 'localhost' || url.includes('/uploads/'))) {
      return parsed.pathname + (parsed.search || '') + (parsed.hash || '');
    }
    return url;
  } catch {
    return url.replace(/^https?:\/\/[^/]+\//, '');
  }
}

function mapBackendProject(dto: BackendProjectDTO): Project {
  const detectMediaType = (m: BackendMediaDTO): string => {
    const raw = (m.type || '').toLowerCase();
    if (raw === 'youtube' || /youtube\.com|youtu\.be/i.test(m.url || '')) return 'youtube';
    if (raw === 'vimeo'   || /vimeo\.com/i.test(m.url || ''))             return 'vimeo';
    if (raw === 'figma'   || /figma\.com/i.test(m.url || ''))             return 'figma';
    // Google Slides: docs.google.com/presentation OR /slides
    if (raw === 'slides'  || /docs\.google\.com\/(presentation|.*slide)/i.test(m.url || '')) return 'slides';
    // Google Docs: docs.google.com/document
    if (/docs\.google\.com\/document/i.test(m.url || ''))                  return 'document';
    if (allowedMediaTypes.has(raw)) return raw;
    return 'link';
  };

  const mappedMedia = (dto.media || [])
    .filter((m) => m?.url && !['pdf', 'document', 'image'].includes((m.type || '').toLowerCase()))
    .map((m, index) => ({
      id: `${dto.projectId}-${index}`,
      projectId: dto.projectId,
      url: m.url,
      type: detectMediaType(m) as ProjectMedia['type'],
      title: m.title || m.url,
    }));

  const mappedFiles = (dto.media || [])
    .filter((m) => m?.url && ['pdf', 'document'].includes((m.type || '').toLowerCase()))
    .map((m, index) => ({
      id: `${dto.projectId}-file-${index}`,
      projectId: dto.projectId,
      name: m.title || `document-${index + 1}.pdf`,
      type: 'application/pdf',
      size: m.size ?? 0,
      url: m.url,
    }));

  const baseProject: Project = {
    id: dto.projectId,
    profileId: dto.profileId,
    title: dto.title || '',
    description: dto.description || '',
    // ── Campos nuevos ──
    category: (dto.category || 'Other') as ProjectCategory,
    status: (dto.status || 'draft') as ProjectStatus,
    isPublic: (dto.visibility || '').toLowerCase() === 'public',
    isFeatured: !!dto.isFeatured,
    thumbnail: resolveAssetUrl(dto.thumbnailUrl),
    technicalInfo: {
      role: dto.role || '',
      technologies: dto.technologies || [],
      startDate: dto.startDate || '',
      endDate: dto.endDate || '',
      results: dto.results || '',
    },
    media: mappedMedia,
    files: mappedFiles,
    createdAt: dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updatedAt || new Date().toISOString(),
  };

  return Object.assign(baseProject, {
    thumbnail: resolveAssetUrl(dto.thumbnailUrl),
    repositoryUrl: dto.repositoryUrl || undefined,
  }) as Project;
}

let projectsData: Project[] = [];

export const projectsService = {

  async getProjects(profileId: string): Promise<Project[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/profile/${profileId}`, {
        signal: controller.signal,
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('No se pudieron cargar los proyectos');
      const body = (await response.json()) as ApiResponse<BackendProjectDTO[]>;
      const rows = body.data ?? [];
      projectsData = rows.map(mapBackendProject);
      return projectsData;
    } finally {
      clearTimeout(timer);
    }
  },

  async getProject(projectId: string): Promise<Project | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        signal: controller.signal,
        headers: getAuthHeaders(),
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('No se pudo cargar el proyecto');
      const body = (await response.json()) as ApiResponse<BackendProjectDTO>;
      return mapBackendProject(body.data);
    } finally {
      clearTimeout(timer);
    }
  },

  async getPublicProjects(profileId: string): Promise<Project[]> {
    return projectsData.filter((p) => p.profileId === profileId && p.isPublic);
  },

  async createProject(profileId: string, data: Partial<Project>): Promise<Project> {
    const payload = buildPayload(null, profileId, data);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        signal: controller.signal,
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || 'No se pudo guardar el proyecto en backend');
    }

    const result = await response.json().catch(() => null);
    const createdId = result?.data ?? null;
    if (createdId) {
      const refreshed = await this.getProject(createdId);
      if (refreshed) return refreshed;
    }

    
    const fallback: Project = {
      id: createdId || generateId(),
      profileId,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'Other',
      status: data.status || 'draft',
      isPublic: data.isPublic || false,
      isFeatured: data.isFeatured || false,
      thumbnail: data.thumbnail,
      technicalInfo: data.technicalInfo || { role: '', technologies: [], startDate: '', results: '' },
      media: data.media || [],
      files: data.files || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projectsData.push(fallback);
    return fallback;
  },

  async updateProject(projectId: string, data: Partial<Project>, _profileId: string): Promise<Project> {
    const currentProject = projectsData.find((p) => p.id === projectId);
    const profileId = currentProject?.profileId;
    if (!profileId) throw new Error('No se encontró profileId para actualizar el proyecto');

    const payload = buildPayload(projectId, profileId, data, currentProject);
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || 'No se pudo actualizar el proyecto en backend');
    }

    const refreshed = await this.getProject(projectId);
    if (!refreshed) throw new Error('Proyecto actualizado, pero no se pudo recargar');
    projectsData = projectsData.map((p) => (p.id === projectId ? refreshed : p));
    return refreshed;
  },

  async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      throw new Error(txt || 'No se pudo eliminar el proyecto');
    }
    projectsData = projectsData.filter((p) => p.id !== projectId);
  },
};

// ── buildPayload (construye el body para create y update) ─────────────────────

function buildPayload(
  projectId: string | null,
  profileId: string,
  data: Partial<Project>,
  currentProject?: Project | undefined,
) {
  const thumbnail = data.thumbnail ?? currentProject?.thumbnail ?? null;
  const media = data.media ?? [];
  const files = data.files ?? [];

  const normalizedMedia = [
    ...(thumbnail ? [{ type: 'image', url: normalizeUploadedUrl(thumbnail), title: null, size: null }] : []),
    ...media.map((m) => ({ type: m.type, url: normalizeUploadedUrl(m.url) ?? m.url, title: (m as any).title ?? null, size: (m as any).size ?? null })),
  ];
  const normalizedFiles = files.map((f) => ({
    type: 'document',
    url: normalizeUploadedUrl(f.url) ?? f.url,
    title: f.name,
    size: f.size,
  }));

  const techInfo = data.technicalInfo ?? currentProject?.technicalInfo;

  // repositoryUrl: puede venir explícitamente en data o en el payload extendido
  const repoUrl = (data as any).repositoryUrl
    ?? media.map((m) => m.url).find((u) => typeof u === 'string' && /github\.com/i.test(u))
    ?? null;

  return {
    projectId,
    profileId,
    title: data.title ?? currentProject?.title ?? '',
    description: data.description ?? currentProject?.description ?? '',
    repositoryUrl: repoUrl || null,
    isFeatured: data.isFeatured ?? currentProject?.isFeatured ?? false,
    visibility: (data.isPublic ?? currentProject?.isPublic ?? false) ? 'Public' : 'Private',
    media: [...normalizedMedia, ...normalizedFiles],
    // ── Campos nuevos ──────────────────────────────────────────────────────
    category: data.category ?? currentProject?.category ?? 'Other',
    status: toRawStatus(data.status ?? currentProject?.status),
    role: techInfo?.role ?? '',
    startDate: techInfo?.startDate || null,
    endDate: techInfo?.endDate || null,
    results: techInfo?.results ?? '',
    technologies: techInfo?.technologies ?? [],
  };
}

export const connectionsService = {
  async getConnections(_profileId: string): Promise<OAuthConnection[]> {
    return apiRequest<OAuthConnection[]>('/v1/connections');
  },

  async addConnection(provider: string, profileHandle?: string, providerUrl?: string): Promise<OAuthConnection> {
    return apiRequest<OAuthConnection>('/v1/connections', {
      method: 'POST',
      body: JSON.stringify({ provider, profileHandle, providerUrl }),
    });
  },

  async disconnect(connectionId: string): Promise<void> {
    await apiRequest<void>(`/v1/connections/${connectionId}/disconnect`, { method: 'POST' });
  },

  async reconnect(connectionId: string): Promise<OAuthConnection> {
    return apiRequest<OAuthConnection>(`/v1/connections/${connectionId}/reconnect`, { method: 'POST' });
  },

  async sync(connectionId: string): Promise<OAuthConnection> {
    return apiRequest<OAuthConnection>(`/v1/connections/${connectionId}/sync`, { method: 'POST' });
  },

  async deleteConnection(connectionId: string): Promise<void> {
    await apiRequest<void>(`/v1/connections/${connectionId}`, { method: 'DELETE' });
  },

  // ── GitHub / LinkedIn stubs (future integrations) ──
  async getGithubRepos(): Promise<GithubRepository[]> {
    return apiRequest<GithubRepository[]>('/v1/connections/github/repos');
  },

  async getGithubHeatmap() {
    return apiRequest('/v1/connections/github/heatmap');
  },

  async importGithubRepos(repoIds: string[]): Promise<void> {
    await apiRequest<void>('/v1/connections/github/repos/import', {
      method: 'POST',
      body: JSON.stringify({ repoIds }),
    });
  },

  async getLinkedinExperiences() {
    return apiRequest('/v1/connections/linkedin/experiences');
  },

  async getLinkedinEducations() {
    return apiRequest('/v1/connections/linkedin/educations');
  },

  async getRecommendations() {
    return apiRequest('/v1/connections/linkedin/recommendations');
  },

  async importLinkedinData(): Promise<void> {
    await apiRequest<void>('/v1/connections/linkedin/import', { method: 'POST' });
  },

  async syncAll(_profileId: string): Promise<void> {
    await apiRequest<void>('/v1/connections/sync-all', { method: 'POST' });
  },
};

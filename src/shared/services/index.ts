import { delay, generateId } from '../lib/utils';
import {
  mockProfiles,
  mockSoftSkills,
  mockConnections,
  mockGithubRepos,
  mockGithubHeatmap,
  mockLinkedinExperiences,
  mockLinkedinEducations,
  mockRecommendations,
  mockVisibilitySettings,
  mockModerationHistory,
  mockPlatformMetrics,
  mockActivityLogs,
  mockTimeSeriesData,
  mockProfilePreferences,
  mockNotifications,
  reservedSlugs,
  takenSlugs,
} from '../mocks/data';
import type {
  Profile,
  ProfileRole,
  HardSkill,
  SoftSkill,
  GlobalSkillTag,
  SkillLevel,
  Project,
  ProjectMedia,
  ProjectCategory,
  ProjectStatus,
  OAuthConnection,
  GithubRepository,
  VisibilitySettings,
  SectionVisibility,
  PortfolioSection,
  ModerationAction,
  PlatformMetrics,
  ActivityLog,
  TimeSeriesData,
  ProfilePreferences,
  Language,
  Notification,
} from '../types';

const DELAY_MS = 500;
const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '') as string;

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
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
}

// =============================================
// AUTH SERVICE
// =============================================
export const authService = {
  async login(email: string, _password: string, role: ProfileRole): Promise<Profile> {
    await delay(DELAY_MS);
    const profile = mockProfiles.find((u) => u.role === role) || mockProfiles[0];
    return { ...profile, email };
  },

  async logout(): Promise<void> {
    await delay(300);
  },

  async getCurrentProfile(): Promise<Profile | null> {
    await delay(300);
    const stored = localStorage.getItem('ethoshub_profile');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  },

  async updateProfile(profileId: string, data: Partial<Profile>): Promise<Profile> {
    await delay(DELAY_MS);
    const profile = mockProfiles.find((entry) => entry.id === profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    Object.assign(profile, data);
    localStorage.setItem('ethoshub_profile', JSON.stringify(profile));
    return { ...profile };
  },
};

// =============================================
// SKILLS SERVICE
// =============================================
let softSkillsData = [...mockSoftSkills];

export const skillsService = {
  async searchTags(query: string): Promise<GlobalSkillTag[]> {
    const path = query ? `/api/skills/tags?query=${encodeURIComponent(query)}` : '/api/skills/tags';
    return apiRequest<GlobalSkillTag[]>(path);
  },

  async getHardSkills(profileId: string): Promise<HardSkill[]> {
    return apiRequest<HardSkill[]>(`/api/profiles/${profileId}/skills/hard`);
  },

  async addHardSkill(
    profileId: string,
    tagId: string,
    level: SkillLevel
  ): Promise<HardSkill> {
    return apiRequest<HardSkill>(`/api/profiles/${profileId}/skills/hard`, {
      method: 'POST',
      body: JSON.stringify({ tagId, level }),
    });
  },

  async createTag(name: string, category: string): Promise<GlobalSkillTag> {
    return apiRequest<GlobalSkillTag>('/api/skills/tags', {
      method: 'POST',
      body: JSON.stringify({ name, category }),
    });
  },

  async updateHardSkill(skillId: string, level: SkillLevel): Promise<HardSkill> {
    return apiRequest<HardSkill>(`/api/skills/hard/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify({ level }),
    });
  },

  async removeHardSkill(skillId: string): Promise<void> {
    await apiRequest<void>(`/api/skills/hard/${skillId}`, {
      method: 'DELETE',
    });
  },

  async toggleTopSkill(skillId: string): Promise<HardSkill> {
    return apiRequest<HardSkill>(`/api/skills/hard/${skillId}/top`, {
      method: 'PATCH',
    });
  },

  async toggleEndorsement(skillId: string, endorserId: string, endorserName: string, endorserAvatar: string): Promise<void> {
    await apiRequest<HardSkill>(`/api/skills/hard/${skillId}/endorsements/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ endorserId, endorserName, endorserAvatar }),
    });
  },

  async reorderTopSkills(profileId: string, skillIds: string[]): Promise<HardSkill[]> {
    return apiRequest<HardSkill[]>(`/api/profiles/${profileId}/skills/hard/top-order`, {
      method: 'PATCH',
      body: JSON.stringify({ skillIds }),
    });
  },

  async getSoftSkills(profileId: string): Promise<SoftSkill[]> {
    return apiRequest<SoftSkill[]>(`/api/profiles/${profileId}/skills/soft`);
  },

  async addSoftSkill(profileId: string, title: string, description?: string): Promise<SoftSkill> {
    return apiRequest<SoftSkill>(`/api/profiles/${profileId}/skills/soft`, {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  },

  async updateSoftSkill(skillId: string, title: string, description?: string): Promise<SoftSkill> {
    return apiRequest<SoftSkill>(`/api/skills/soft/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description }),
    });
  },

  async removeSoftSkill(skillId: string): Promise<void> {
    await apiRequest<void>(`/api/skills/soft/${skillId}`, {
      method: 'DELETE',
    });
  },

  async getAllTags(): Promise<GlobalSkillTag[]> {
    return apiRequest<GlobalSkillTag[]>('/api/skills/tags/all');
  },

  async mergeTags(sourceIds: string[], targetId: string): Promise<void> {
    await delay(DELAY_MS);
    void sourceIds;
    void targetId;
  },
};

// =============================================
// PROJECTS SERVICE 
// =============================================

// ── Tipos auxiliares ─────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const allowedMediaTypes = new Set(['youtube', 'vimeo', 'figma', 'slides', 'document', 'link']);

/** Convierte el label visible al valor raw que espera la BD */
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
    const parsed = new URL(url, API_BASE_URL);
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

// ── Mapeador principal ────────────────────────────────────────────────────────

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

// ── Service ───────────────────────────────────────────────────────────────────

let projectsData: Project[] = [];

export const projectsService = {

  async getProjects(profileId: string): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/api/projects/profile/${profileId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('No se pudieron cargar los proyectos');
    const body = (await response.json()) as ApiResponse<BackendProjectDTO[]>;
    const rows = body.data ?? [];
    projectsData = rows.map(mapBackendProject);
    return projectsData;
  },

  async getProject(projectId: string): Promise<Project | null> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('No se pudo cargar el proyecto');
    const body = (await response.json()) as ApiResponse<BackendProjectDTO>;
    return mapBackendProject(body.data);
  },

  async getPublicProjects(profileId: string): Promise<Project[]> {
    return projectsData.filter((p) => p.profileId === profileId && p.isPublic);
  },

  async createProject(profileId: string, data: Partial<Project>): Promise<Project> {
    const payload = buildPayload(null, profileId, data);
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });

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

    // Fallback local (no debería ocurrir)
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
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
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
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
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
    repositoryUrl: repoUrl,
    isFeatured: data.isFeatured ?? currentProject?.isFeatured ?? false,
    visibility: (data.isPublic ?? currentProject?.isPublic ?? false) ? 'Public' : 'Private',
    media: [...normalizedMedia, ...normalizedFiles],
    // ── Campos nuevos ──────────────────────────────────────────────────────
    category: data.category ?? currentProject?.category ?? 'Other',
    status: toRawStatus(data.status ?? currentProject?.status),
    role: techInfo?.role ?? '',
    startDate: techInfo?.startDate ?? null,
    endDate: techInfo?.endDate ?? null,
    results: techInfo?.results ?? '',
    technologies: techInfo?.technologies ?? [],
  };
}

// =============================================
// CONNECTIONS SERVICE
// =============================================
export const connectionsService = {
  async getConnections(profileId: string): Promise<OAuthConnection[]> {
    await delay(DELAY_MS);
    return mockConnections.filter((c) => c.profileId === profileId);
  },

  async syncAll(profileId: string): Promise<void> {
    await delay(1500);
    console.log('Synced all connections for profile:', profileId);
  },

  async disconnect(connectionId: string): Promise<void> {
    await delay(DELAY_MS);
    console.log('Disconnected:', connectionId);
  },

  async reconnect(connectionId: string): Promise<OAuthConnection> {
    await delay(1000);
    const connection = mockConnections.find((c) => c.id === connectionId);
    if (!connection) throw new Error('Connection not found');
    return { ...connection, status: 'connected', lastSynced: new Date().toISOString() };
  },

  async getGithubRepos(): Promise<GithubRepository[]> {
    await delay(DELAY_MS);
    return mockGithubRepos;
  },

  async getGithubHeatmap() {
    await delay(DELAY_MS);
    return mockGithubHeatmap;
  },

  async importGithubRepos(repoIds: string[]): Promise<void> {
    await delay(1000);
    console.log('Imported repos:', repoIds);
  },

  async getLinkedinExperiences() {
    await delay(DELAY_MS);
    return mockLinkedinExperiences;
  },

  async getLinkedinEducations() {
    await delay(DELAY_MS);
    return mockLinkedinEducations;
  },

  async getRecommendations() {
    await delay(DELAY_MS);
    return mockRecommendations;
  },

  async importLinkedinData(): Promise<void> {
    await delay(1000);
    console.log('LinkedIn data imported');
  },
};

// =============================================
// VISIBILITY SERVICE
// =============================================
export const visibilityService = {
  async getSettings(profileId: string): Promise<VisibilitySettings | null> {
    await delay(DELAY_MS);
    return mockVisibilitySettings.find((v) => v.profileId === profileId) || null;
  },

  async checkSlugAvailability(slug: string): Promise<{ available: boolean; reason?: string }> {
    await delay(300);
    if (reservedSlugs.includes(slug)) {
      return { available: false, reason: 'reserved' };
    }
    if (takenSlugs.includes(slug)) {
      return { available: false, reason: 'taken' };
    }
    return { available: true };
  },

  async updateSlug(profileId: string, slug: string): Promise<void> {
    await delay(DELAY_MS);
    const settings = mockVisibilitySettings.find((v) => v.profileId === profileId);
    if (settings) {
      settings.slug = slug;
    }
  },

  async updateSectionVisibility(
    profileId: string,
    section: PortfolioSection,
    visibility: SectionVisibility
  ): Promise<void> {
    await delay(DELAY_MS);
    const settings = mockVisibilitySettings.find((v) => v.profileId === profileId);
    if (settings) {
      settings.sections[section] = visibility;
    }
  },

  async updateSeoSettings(profileId: string, seo: { title: string; description: string }): Promise<void> {
    await delay(DELAY_MS);
    const settings = mockVisibilitySettings.find((v) => v.profileId === profileId);
    if (settings) {
      settings.seo = seo;
    }
  },

  async updatePasswordProtection(profileId: string, enabled: boolean, password?: string): Promise<void> {
    await delay(DELAY_MS);
    const settings = mockVisibilitySettings.find((v) => v.profileId === profileId);
    if (settings) {
      settings.isPasswordProtected = enabled;
      settings.password = password;
    }
  },

  async getPublicPortfolio(slug: string): Promise<{ profile: Profile; settings: VisibilitySettings } | null> {
    await delay(DELAY_MS);
    const settings = mockVisibilitySettings.find((v) => v.slug === slug);
    if (!settings) return null;
    const profile = mockProfiles.find((u) => u.id === settings.profileId);
    if (!profile) return null;
    return { profile, settings };
  },

  async verifyPassword(slug: string, password: string): Promise<boolean> {
    await delay(DELAY_MS);
    const settings = mockVisibilitySettings.find((v) => v.slug === slug);
    return settings?.password === password;
  },

  async getPublicPortfolios(): Promise<{ profile: Profile; settings: VisibilitySettings }[]> {
    await delay(DELAY_MS);
    return mockVisibilitySettings
      .filter((v) => v.isPublicProfileEnabled && !v.isPasswordProtected)
      .map((settings) => {
        const profile = mockProfiles.find((u) => u.id === settings.profileId)!;
        return { profile, settings };
      });
  },

  async getModerationHistory(portfolioId: string): Promise<ModerationAction[]> {
    await delay(DELAY_MS);
    return mockModerationHistory.filter((m) => m.portfolioId === portfolioId);
  },

  async moderatePortfolio(
    portfolioId: string,
    action: ModerationAction['actionType'],
    reason?: string
  ): Promise<void> {
    await delay(DELAY_MS);
    mockModerationHistory.push({
      id: generateId(),
      portfolioId,
      adminId: '3',
      adminName: 'Admin EthosHub',
      actionType: action,
      previousState: 'active',
      newState: action === 'deactivate' ? 'deactivated' : 'active',
      reason,
      createdAt: new Date().toISOString(),
    });
  },
};

// =============================================
// ANALYTICS SERVICE
// =============================================
export const analyticsService = {
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    await delay(DELAY_MS);
    return mockPlatformMetrics;
  },

  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    await delay(DELAY_MS);
    return mockActivityLogs.slice(0, limit);
  },

  async getTimeSeriesData(days: number = 30): Promise<TimeSeriesData[]> {
    await delay(DELAY_MS);
    return mockTimeSeriesData.slice(-days);
  },
};

// =============================================
// PREFERENCES SERVICE
// =============================================
let profilePreferencesData = { ...mockProfilePreferences };

export const preferencesService = {
  async getPreferences(profileId: string): Promise<ProfilePreferences> {
    await delay(DELAY_MS);
    return { ...profilePreferencesData, profileId };
  },

  async updateLanguage(language: Language): Promise<void> {
    await delay(300);
    profilePreferencesData.language = language;
    localStorage.setItem('ethoshub_language', language);
  },

  async updateSectionOrder(order: PortfolioSection[]): Promise<void> {
    await delay(DELAY_MS);
    profilePreferencesData.sectionOrder = order;
  },

  async updatePreference(key: keyof ProfilePreferences, value: unknown): Promise<void> {
    await delay(DELAY_MS);
    (profilePreferencesData as Record<string, unknown>)[key] = value;
  },
};

// =============================================
// NOTIFICATIONS SERVICE
// =============================================
let notificationsData = [...mockNotifications];

export const notificationsService = {
  async getNotifications(profileId: string): Promise<Notification[]> {
    await delay(DELAY_MS);
    return notificationsData.filter((n) => n.profileId === profileId);
  },

  async markAsRead(notificationId: string): Promise<void> {
    await delay(300);
    const notification = notificationsData.find((n) => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  },

  async markAllAsRead(profileId: string): Promise<void> {
    await delay(300);
    notificationsData
      .filter((n) => n.profileId === profileId)
      .forEach((n) => {
        n.isRead = true;
      });
  },
};
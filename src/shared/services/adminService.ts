import { apiClient } from './apiClient';

/**
 * Typed client for the admin panel endpoints (`/api/admin/**`).
 * Every call returns real platform data; no mocks.
 */

export interface AdminGlobalMetrics {
  totalProfiles: number;
  professionalProfiles: number;
  recruiterProfiles: number;
  activePortfolios: number;
  totalPortfolios: number;
  newProfiles24h: number;
  newProfilesPrev24h: number;
  newProfiles30d: number;
}

export interface AdminGrowthPoint {
  day: string;
  newProfessionals: number;
  newRecruiters: number;
  cumulativeTotal: number;
}

export interface AdminRoleDistribution {
  professionals: number;
  recruiters: number;
  admins: number;
}

export interface AdminTopSkill {
  tagId: string;
  name: string;
  category: string;
  profileCount: number;
}

export interface AdminSystemHealth {
  databaseSizeMb: number | null;
  activeConnections: number | null;
  totalConnections: number | null;
  maxConnections: number | null;
  cacheHitRatio: number | null;
  commits: number | null;
  rollbacks: number | null;
  avgQueryTimeMs: number | null;
  totalQueries: number | null;
  slowestQueryMs: number | null;
  uptimeSeconds: number | null;
  postgresVersion: string | null;
}

export type AdminLogSeverity = 'info' | 'success' | 'warning' | 'error';

export interface AdminSystemLog {
  id: number;
  eventType: string;
  severity: AdminLogSeverity;
  message: string;
  profileId: string | null;
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.get<ApiEnvelope<T>>(url, { params });
  return data.data;
}

export type AdminProfileRole = 'professional' | 'recruiter';
export type AdminProfileStatus = 'active' | 'deleted';

export interface AdminProfileItem {
  profileId: string;
  email: string;
  fullName: string | null;
  role: AdminProfileRole;
  status: AdminProfileStatus;
  createdAt: string;
  updatedAt: string;
  detail: string | null;
  avatarUrl: string | null;
  portfolioPublished: boolean;
}

export interface AdminProfilePage {
  items: AdminProfileItem[];
  total: number;
  page: number;
  size: number;
}

export interface AdminProfileFilters {
  role?: string;
  status?: string;
  search?: string;
}

export const adminProfileService = {
  search: (filters: AdminProfileFilters, page: number, size: number) =>
    get<AdminProfilePage>('/admin/profiles', { ...filters, page, size }),

  /** Downloads the filtered profile list as a CSV file. */
  async exportCsv(filters: AdminProfileFilters): Promise<void> {
    const response = await apiClient.get('/admin/profiles/export', {
      params: filters,
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ethoshub-profiles-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};

export interface AdminInspectedProfile {
  profileId: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  seniority: string | null;
  isActive: boolean | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInspectedPortfolio {
  slug: string | null;
  isPublished: boolean | null;
  viewsCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInspectedProject {
  id: string;
  title: string;
  category: string | null;
  status: string | null;
  visibility: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminInspectedEducation {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminInspectedExperience {
  id: string;
  companyName: string;
  jobTitle: string;
  isCurrent: boolean | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminProfileInspection {
  profile: AdminInspectedProfile | null;
  portfolio: AdminInspectedPortfolio | null;
  projects: AdminInspectedProject[];
  education: AdminInspectedEducation[];
  experience: AdminInspectedExperience[];
}

export type AdminRestorableRecordType = 'project' | 'education' | 'experience';

export const adminModerationService = {
  inspect: (profileId: string) =>
    get<AdminProfileInspection>(`/admin/moderation/profiles/${profileId}`),

  softDeleteProfile: async (profileId: string, role: AdminProfileRole): Promise<void> => {
    await apiClient.delete(`/admin/moderation/profiles/${profileId}`, { params: { role } });
  },

  restoreProfile: async (profileId: string, role: AdminProfileRole): Promise<void> => {
    await apiClient.post(`/admin/moderation/profiles/${profileId}/restore`, null, { params: { role } });
  },

  restoreRecord: async (recordType: AdminRestorableRecordType, recordId: string): Promise<void> => {
    await apiClient.post(`/admin/moderation/records/${recordType}/${recordId}/restore`);
  },
};

export interface AdminSkillTag {
  id: string;
  name: string;
  category: string;
  isNormalized: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSkillPage {
  items: AdminSkillTag[];
  total: number;
  page: number;
  size: number;
}

export interface AdminSkillMetrics {
  totalTags: number;
  normalizedTags: number;
  usedTags: number;
  unusedTags: number;
  categories: number;
}

export interface AdminSkillFilters {
  search?: string;
  category?: string;
  usage?: 'used' | 'unused' | '';
}

export interface AdminSkillUpsert {
  name: string;
  category: string;
  isNormalized?: boolean;
}

export const adminSkillService = {
  search: (filters: AdminSkillFilters, page: number, size: number) =>
    get<AdminSkillPage>('/admin/skills', { ...filters, page, size }),

  getMetrics: () =>
    get<AdminSkillMetrics>('/admin/skills/metrics'),

  create: async (payload: AdminSkillUpsert): Promise<AdminSkillTag> => {
    const { data } = await apiClient.post<ApiEnvelope<AdminSkillTag>>('/admin/skills', payload);
    return data.data;
  },

  update: async (tagId: string, payload: AdminSkillUpsert): Promise<AdminSkillTag> => {
    const { data } = await apiClient.put<ApiEnvelope<AdminSkillTag>>(`/admin/skills/${tagId}`, payload);
    return data.data;
  },

  deleteUnused: async (tagIds: string[]): Promise<{ deleted: number; skipped: number }> => {
    const { data } = await apiClient.delete<ApiEnvelope<{ deleted: number; skipped: number }>>(
      '/admin/skills',
      { data: { tagIds } },
    );
    return data.data;
  },
};

export interface AdminEmailPayload {
  recipients: string[];
  subject: string;
  bodyHtml: string;
}

export const adminEmailService = {
  send: async (payload: AdminEmailPayload): Promise<{ queued: number }> => {
    const { data } = await apiClient.post<ApiEnvelope<{ queued: number }>>('/admin/email/send', payload);
    return data.data;
  },
};

export const adminMetricsService = {
  getOverview: () =>
    get<AdminGlobalMetrics>('/admin/metrics/overview'),

  getGrowth: (days: number) =>
    get<AdminGrowthPoint[]>('/admin/metrics/growth', { days }),

  getRoles: () =>
    get<AdminRoleDistribution>('/admin/metrics/roles'),

  getTopSkills: (limit = 5) =>
    get<AdminTopSkill[]>('/admin/metrics/top-skills', { limit }),

  getHealth: () =>
    get<AdminSystemHealth>('/admin/metrics/health'),

  getLogs: (limit = 50) =>
    get<AdminSystemLog[]>('/admin/logs', { limit }),
};

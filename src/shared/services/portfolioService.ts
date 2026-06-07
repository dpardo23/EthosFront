import { apiClient } from './apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PortfolioSettings {
  portfolioSettingsId: string;
  isPublished: boolean;
  slug: string | null;
  customHeadline: string | null;
  customBio: string | null;
  accentColor: string;
  showEmail: boolean;
  showLocation: boolean;
  showWebsite: boolean;
  showConnections: boolean;
  showGithubHeatmap: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  viewsCount: number;
  selectedItems: SelectedItem[];
}

export interface SelectedItem {
  itemType: string;
  itemId: string;
  displayOrder: number;
}

export interface UpdateSettingsRequest {
  isPublished?: boolean;
  slug?: string;
  customHeadline?: string | null;
  customBio?: string | null;
  accentColor?: string;
  showEmail?: boolean;
  showLocation?: boolean;
  showWebsite?: boolean;
  showConnections?: boolean;
  showGithubHeatmap?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateItemsRequest {
  itemType: 'project' | 'experience' | 'education' | 'hard_skill' | 'soft_skill';
  itemIds: string[];
}

export interface AvailableItems {
  projects: AvailableProject[];
  experiences: AvailableExperience[];
  education: AvailableEducation[];
  hardSkills: AvailableSkill[];
  softSkills: AvailableSkill[];
}

export interface AvailableProject {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string;
  status: string;
  isFeatured: boolean;
  technologies: string[];
  isSelected: boolean;
  displayOrder: number;
}

export interface AvailableExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string | null;
  logoUrl: string | null;
  isSelected: boolean;
  displayOrder: number;
}

export interface AvailableEducation {
  id: string;
  degree: string;
  fieldOfStudy: string | null;
  institution: string;
  startDate: string;
  endDate: string | null;
  inProgress: boolean;
  logoUrl: string | null;
  isSelected: boolean;
  displayOrder: number;
}

export interface AvailableSkill {
  id: string;
  name: string;
  category: string | null;
  level: string | null;
  isSelected: boolean;
  displayOrder: number;
}

export interface PublicPortfolio {
  slug: string;
  name: string;
  professionalTitle: string | null;
  bio: string | null;
  location: string | null;
  email: string | null;
  website: string | null;
  photoUrl: string | null;
  accentColor: string;
  viewsCount: number;
  showConnections: boolean;
  showGithubHeatmap: boolean;
  seniority: string | null;
  availabilityStatus: string | null;
  latitude: number | null;
  longitude: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  cvPdfUrl: string | null;
  projects: PublicProject[];
  experiences: PublicExperience[];
  education: PublicEducation[];
  hardSkills: PublicHardSkill[];
  softSkills: PublicSoftSkill[];
}

export interface ProjectMedia {
  url: string | null;
  type: string | null;
  title: string | null;
}

export interface PublicProject {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string;
  status: string;
  isFeatured: boolean;
  technologies: string[];
  role: string | null;
  results: string | null;
  repositoryUrl: string | null;
  media: ProjectMedia[] | null;
  displayOrder: number;
}

export interface PublicExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  description: string | null;
  isCurrent: boolean;
  startDate: string;
  endDate: string | null;
  logoUrl: string | null;
  companyImageUrl: string | null;
  companyUrl: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  technologies: string[];
  displayOrder: number;
}

export interface PublicEducation {
  id: string;
  degree: string;
  fieldOfStudy: string | null;
  institution: string;
  startDate: string;
  endDate: string | null;
  inProgress: boolean;
  logoUrl: string | null;
  credentialUrl: string | null;
  verificationUrl: string | null;
  educationType: string | null;
  gpa: number | null;
  description: string | null;
  displayOrder: number;
}

export interface PublicHardSkill {
  id: string;
  name: string;
  category: string | null;
  level: string | null;
  displayOrder: number;
}

export interface PublicSoftSkill {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface CurriculumResponse {
  cvDocumentId: string | null;
  cvPdfUrl: string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const portfolioService = {
  getSettings: async (): Promise<PortfolioSettings> => {
    const res = await apiClient.get<{ data: PortfolioSettings }>('/v1/portfolio/settings');
    return res.data.data;
  },

  updateSettings: async (req: UpdateSettingsRequest): Promise<void> => {
    await apiClient.put('/v1/portfolio/settings', req);
  },

  updateItems: async (req: UpdateItemsRequest): Promise<void> => {
    await apiClient.put('/v1/portfolio/items', req);
  },

  getAvailableItems: async (): Promise<AvailableItems> => {
    const res = await apiClient.get<{ data: AvailableItems }>('/v1/portfolio/items/available');
    return res.data.data;
  },

  getPublicPortfolio: async (slug: string): Promise<PublicPortfolio> => {
    const res = await apiClient.get<{ data: PublicPortfolio }>(`/v1/portfolio/public/${slug}`);
    return res.data.data;
  },

  getPreviewPortfolio: async (): Promise<PublicPortfolio> => {
    const res = await apiClient.get<{ data: PublicPortfolio }>('/v1/portfolio/preview');
    return res.data.data;
  },

  exportPortfolio: async (): Promise<PublicPortfolio> => {
    const res = await apiClient.get<{ data: PublicPortfolio }>('/v1/portfolio/export');
    return res.data.data;
  },

  getCurriculum: async (): Promise<CurriculumResponse> => {
    const res = await apiClient.get<{ data: CurriculumResponse }>('/v1/portfolio/curriculum');
    return res.data.data;
  },

  compileCurriculum: async (cvDocumentId: string, profileImageUrl?: string): Promise<CurriculumResponse> => {
    const res = await apiClient.post<{ data: CurriculumResponse }>('/v1/portfolio/curriculum/compile', {
      cvDocumentId,
      profileImageUrl: profileImageUrl ?? null,
    });
    return res.data.data;
  },
};

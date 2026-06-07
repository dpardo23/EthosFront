

/**
 * Shared TypeScript type definitions for the application domain: user, profile, project, skill, and API response types.
 */
export type ProfileRole = 'professional' | 'recruiter' | 'guest' | 'admin';

export interface Profile {
  id: string;
  email: string;
  name: string;
  profileHandle?: string;
  avatar?: string;
  bio?: string;
  role: ProfileRole;
  slug?: string;
  profession?: string;
  headline?: string;
  location?: string;
  country?: string;
  phone?: string;
  website?: string;
  
  status?: string;    
  seniority?: string; 
  profile_id?: string; 
  createdAt?: string;
  company?: string;
  availabilityStatus?: string;
}
export interface AuthState {
  profile: Profile | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export type SkillLevel = 'Junior' | 'Mid' | 'Senior';

export type SkillCategory = 
  | 'Frontend'
  | 'Backend'
  | 'Data'
  | 'Infrastructure'
  | 'Mobile'
  | 'Design'
  | 'Soft Skill';

export interface GlobalSkillTag {
  id: string;
  name: string;
  category: SkillCategory;
  isNormalized: boolean;
}

export interface HardSkill {
  id: string;
  profileId: string;
  skillTag: GlobalSkillTag;
  level: SkillLevel;
  isTop: boolean;
  topOrder?: number;
  endorsements: Endorsement[];
  createdAt: string;
}

export interface SoftSkill {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  createdAt: string;
}

export interface Endorsement {
  id: string;
  skillId: string;
  endorserId: string;
  endorserName: string;
  endorserAvatar: string;
  createdAt: string;
}

export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';
export type ProjectCategory = 'Web' | 'Mobile' | 'API' | 'Data' | 'DevOps' | 'Other';

export interface Project {
  id: string;
  profileId: string;
  title: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  isPublic: boolean;
  isFeatured: boolean;
  thumbnail?: string;
  repositoryUrl?: string;
  technicalInfo: TechnicalInfo;
  media: ProjectMedia[];
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalInfo {
  role: string;
  technologies: string[];
  startDate: string;
  endDate?: string;
  results: string;
}

export interface ProjectMedia {
  id: string;
  projectId: string;
  url: string;
  type: 'youtube' | 'vimeo' | 'figma' | 'slides' | 'pdf' | 'document' | 'link';
  title: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export type ConnectionProvider =
  | 'email' | 'github' | 'google' | 'gmail'
  | 'linkedin' | 'slack' | 'website' | 'devto';
export type ConnectionStatus = 'connected' | 'disconnected' | 'pending';
export type ApiHealth = 'healthy' | 'degraded' | 'down';

export interface OAuthConnection {
  id: string;
  profileId: string;
  provider: ConnectionProvider;
  status: ConnectionStatus;
  profileHandle?: string;
  providerUrl?: string;
  tokenExpiresAt?: string;
  scopes?: string;
  lastSyncedAt?: string;
  apiHealth: ApiHealth;
  providerMetadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GithubRepository {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  isFork: boolean;
  isImported: boolean;
  url: string;
  readme?: string;
  updatedAt: string;
}

export interface GithubHeatmapDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface LinkedinExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate?: string;
  description: string;
  isCurrent: boolean;
}

export interface LinkedinEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
}

export interface Recommendation {
  id: string;
  authorName: string;
  authorPosition: string;
  authorAvatar: string;
  content: string;
  relationship: string;
  isPublic: boolean;
  createdAt: string;
}

export type SectionVisibility = 'PUBLIC' | 'LINK_ONLY' | 'PRIVATE';
export type PortfolioSection = 'projects' | 'skills' | 'experience' | 'bio' | 'contact';

export interface VisibilitySettings {
  profileId: string;
  slug: string;
  isPublicProfileEnabled: boolean;
  isPasswordProtected: boolean;
  password?: string;
  sections: Record<PortfolioSection, SectionVisibility>;
  seo: SeoMetadata;
  openGraph: OpenGraphData;
  showConnections: boolean;
  showGithubHeatmap: boolean;
  seoTitle: string;
  seoDescription: string;
}

export interface SeoMetadata {
  title: string;
  description: string;
}

export interface OpenGraphData {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
}

export interface ModerationAction {
  id: string;
  portfolioId: string;
  adminId: string;
  adminName: string;
  actionType: 'deactivate' | 'reactivate' | 'make_private' | 'make_public';
  previousState: string;
  newState: string;
  reason?: string;
  createdAt: string;
}

export interface PortfolioMetrics {
  profileId: string;
  totalVisits: number;
  uniqueVisitors: number;
  totalInteractions: number;
  avgTimeOnPage: number;
  topReferrers: { source: string; count: number }[];
}

export interface PlatformMetrics {
  totalProfiles: number;
  activeProfiles: number;
  inactiveProfiles: number;
  totalPortfolios: number;
  publishedPortfolios: number;
  totalVisits: number;
  totalInteractions: number;
  profileGrowth: number;
  visitGrowth: number;
}

export interface ActivityLog {
  id: string;
  type: 'profile_registered' | 'portfolio_created' | 'portfolio_published' | 'visit' | 'interaction';
  description: string;
  profileId?: string;
  profileHandle?: string;
  createdAt: string;
}

export interface TimeSeriesData {
  date: string;
  visits: number;
  interactions: number;
}

export type Language = 'es' | 'en' | 'pt';
export type Theme = 'light' | 'dark' | 'system';

export interface NotificationPreferences {
  connections: boolean;
  messages: boolean;
  projectViews: boolean;
  weeklyDigest: boolean;
  marketing: boolean;
  push_connections: boolean;
  push_messages: boolean;
  push_mentions: boolean;
}

export interface PrivacyPreferences {
  showEmail: boolean;
  showLocation: boolean;
  showConnections: boolean;
  allowMessages: boolean;
}

export interface ProfilePreferences {
  profileId: string;
  language: Language;
  theme: Theme;
  showGithubHeatmap: boolean;
  showLinkedinRecommendations: boolean;
  sectionOrder: PortfolioSection[];
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export type NotificationType = 'endorsement' | 'visit' | 'recommendation' | 'system' | 'message';

export interface Notification {
  id: string;
  profileId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AcademicRecord {
  id: string;
  profileId: string;
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  credentialUrl?: string;
  institutionLogoUrl?: string;
  educationType?: string;
  gpa?: number | null;
  verificationUrl?: string;
  isVisible?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  profile_id?: string;
  company_name: string;
  industry: string;
  company_size: number | string;
  nit: string;
  contact_first_name: string;
  contact_last_name: string;
  website_url: string;
  phone?: string;
  location?: string;
  description?: string;
  logo_url?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

// =============================================
// AUTH & USERS
// =============================================
export type UserRole = 'professional' | 'recruiter' | 'guest' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  slug?: string;
  profession?: string;
  headline?: string;
  location?: string;
  country?: string;
  phone?: string;
  website?: string;
  // Campos añadidos para la sincronización con la DB
  status?: string;    // Mapeado a core.availabilities.status [cite: 179]
  seniority?: string; // Mapeado a core.profiles_basic.seniority [cite: 377]
  profile_id?: string; // ID del perfil en la tabla core.profiles
  createdAt?: string;
  company?: string;
  availabilityStatus?: string;
}
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// =============================================
// SKILLS
// =============================================
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
  userId: string;
  skillTag: GlobalSkillTag;
  level: SkillLevel;
  isTop: boolean;
  topOrder?: number;
  endorsements: Endorsement[];
  createdAt: string;
}

export interface SoftSkill {
  id: string;
  userId: string;
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

// =============================================
// PROJECTS
// =============================================
export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';
export type ProjectCategory = 'Web' | 'Mobile' | 'API' | 'Data' | 'DevOps' | 'Other';

export interface Project {
  id: string;
  userId: string;
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
  type: 'youtube' | 'vimeo' | 'figma' | 'slides' | 'pdf' | 'document';
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

// =============================================
// CONNECTIONS (GitHub/LinkedIn)
// =============================================
export type ConnectionProvider = 'github' | 'linkedin';
export type ConnectionStatus = 'connected' | 'disconnected' | 'expired';

export interface OAuthConnection {
  id: string;
  userId: string;
  provider: ConnectionProvider;
  status: ConnectionStatus;
  lastSynced?: string;
  tokenExpiresAt?: string;
  apiHealth: 'healthy' | 'degraded' | 'down';
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

// =============================================
// VISIBILITY & SEO
// =============================================
export type SectionVisibility = 'PUBLIC' | 'LINK_ONLY' | 'PRIVATE';
export type PortfolioSection = 'projects' | 'skills' | 'experience' | 'bio' | 'contact';

export interface VisibilitySettings {
  userId: string;
  slug: string;
  isPublicProfileEnabled: boolean;
  isPasswordProtected: boolean;
  password?: string;
  sections: Record<PortfolioSection, SectionVisibility>;
  seo: SeoMetadata;
  openGraph: OpenGraphData;
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

// =============================================
// ANALYTICS
// =============================================
export interface PortfolioMetrics {
  userId: string;
  totalVisits: number;
  uniqueVisitors: number;
  totalInteractions: number;
  avgTimeOnPage: number;
  topReferrers: { source: string; count: number }[];
}

export interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalPortfolios: number;
  publishedPortfolios: number;
  totalVisits: number;
  totalInteractions: number;
  userGrowth: number;
  visitGrowth: number;
}

export interface ActivityLog {
  id: string;
  type: 'user_registered' | 'portfolio_created' | 'portfolio_published' | 'visit' | 'interaction';
  description: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

export interface TimeSeriesData {
  date: string;
  visits: number;
  interactions: number;
}

// =============================================
// PREFERENCES
// =============================================
export type Language = 'es' | 'en';
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

export interface UserPreferences {
  userId: string;
  language: Language;
  theme: Theme;
  showGithubHeatmap: boolean;
  showLinkedinRecommendations: boolean;
  sectionOrder: PortfolioSection[];
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

// =============================================
// NOTIFICATIONS
// =============================================
export type NotificationType = 'endorsement' | 'visit' | 'recommendation' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// =============================================
// ACADEMIC RECORDS (Formacion)
// =============================================
export interface AcademicRecord {
  id: string;
  userId: string;
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  credentialUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// RECRUITER PROFILE (Perfil de Empresa)
// =============================================
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

// =============================================
// UI STATE
// =============================================
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

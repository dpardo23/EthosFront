import { apiClient } from './apiClient';
import type {
  Language,
  NotificationPreferences,
  PortfolioSection,
  PrivacyPreferences,
  ProfilePreferences,
  Theme,
} from '../types';

/**
 * Real preferences client backed by core.profile_preferences through the
 * backend (`/api/v1/preferences`). The authenticated profile is resolved
 * server-side from the JWT.
 */
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

interface BackendPreferences {
  profileId: string;
  language: string;
  theme: string;
  showGithubHeatmap: boolean;
  showLinkedinRecommendations: boolean;
  sectionOrder: string[];
  notifications: Partial<NotificationPreferences>;
  privacy: Partial<PrivacyPreferences>;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  connections: true,
  messages: true,
  projectViews: true,
  weeklyDigest: false,
  marketing: false,
  push_connections: true,
  push_messages: true,
  push_mentions: true,
};

const DEFAULT_PRIVACY: PrivacyPreferences = {
  showEmail: false,
  showLocation: true,
  showConnections: true,
  allowMessages: true,
};

function mapPreferences(raw: BackendPreferences): ProfilePreferences {
  return {
    profileId: raw.profileId,
    language: (raw.language || 'es') as Language,
    theme: (raw.theme || 'dark') as Theme,
    showGithubHeatmap: raw.showGithubHeatmap,
    showLinkedinRecommendations: raw.showLinkedinRecommendations,
    sectionOrder: (raw.sectionOrder ?? []) as PortfolioSection[],
    notifications: { ...DEFAULT_NOTIFICATIONS, ...(raw.notifications ?? {}) },
    privacy: { ...DEFAULT_PRIVACY, ...(raw.privacy ?? {}) },
  };
}

export const preferencesService = {
  async getPreferences(): Promise<ProfilePreferences> {
    const { data } = await apiClient.get<ApiEnvelope<BackendPreferences>>('/v1/preferences');
    return mapPreferences(data.data);
  },

  async updatePreferences(updates: Partial<ProfilePreferences>): Promise<ProfilePreferences> {
    const { data } = await apiClient.put<ApiEnvelope<BackendPreferences>>('/v1/preferences', {
      language: updates.language,
      theme: updates.theme,
      showGithubHeatmap: updates.showGithubHeatmap,
      showLinkedinRecommendations: updates.showLinkedinRecommendations,
      sectionOrder: updates.sectionOrder,
      notifications: updates.notifications,
      privacy: updates.privacy,
    });
    if (updates.language) {
      localStorage.setItem('ethoshub_language', updates.language);
    }
    return mapPreferences(data.data);
  },
};

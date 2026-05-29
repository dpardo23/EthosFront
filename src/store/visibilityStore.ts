import { create } from 'zustand';
import type {
  VisibilitySettings,
  SectionVisibility,
  PortfolioSection,
  ModerationAction,
  Profile,
} from '@/shared/types';
import { visibilityService } from '@/shared/services';

interface VisibilityStore {
  settings: VisibilitySettings | null;
  publicPortfolio: { profile: Profile; settings: VisibilitySettings } | null;
  publicPortfolios: { profile: Profile; settings: VisibilitySettings }[];
  moderationHistory: ModerationAction[];
  slugAvailability: { available: boolean; reason?: string } | null;
  loading: boolean;
  error: string | null;
  fetchSettings: (profileId: string) => Promise<void>;
  checkSlugAvailability: (slug: string) => Promise<void>;
  updateSlug: (profileId: string, slug: string) => Promise<void>;
  updateSectionVisibility: (profileId: string, section: PortfolioSection, visibility: SectionVisibility) => Promise<void>;
  updateSeoSettings: (profileId: string, seo: { title: string; description: string }) => Promise<void>;
  updatePasswordProtection: (profileId: string, enabled: boolean, password?: string) => Promise<void>;
  fetchPublicPortfolio: (slug: string) => Promise<void>;
  verifyPassword: (slug: string, password: string) => Promise<boolean>;
  fetchPublicPortfolios: () => Promise<void>;
  fetchModerationHistory: (portfolioId: string) => Promise<void>;
  moderatePortfolio: (portfolioId: string, action: ModerationAction['actionType'], reason?: string) => Promise<void>;
}

export const useVisibilityStore = create<VisibilityStore>((set) => ({
  settings: null,
  publicPortfolio: null,
  publicPortfolios: [],
  moderationHistory: [],
  slugAvailability: null,
  loading: false,
  error: null,

  fetchSettings: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      const settings = await visibilityService.getSettings(profileId);
      set({ settings, loading: false });
    } catch {
      set({ error: 'Error al cargar configuración', loading: false });
    }
  },

  checkSlugAvailability: async (slug: string) => {
    try {
      const slugAvailability = await visibilityService.checkSlugAvailability(slug);
      set({ slugAvailability });
    } catch {
      set({ slugAvailability: null });
    }
  },

  updateSlug: async (profileId: string, slug: string) => {
    set({ loading: true, error: null });
    try {
      await visibilityService.updateSlug(profileId, slug);
      set((state) => ({
        settings: state.settings ? { ...state.settings, slug } : null,
        loading: false,
      }));
    } catch {
      set({ error: 'Error al actualizar slug', loading: false });
    }
  },

  updateSectionVisibility: async (profileId: string, section: PortfolioSection, visibility: SectionVisibility) => {
    set({ loading: true, error: null });
    try {
      await visibilityService.updateSectionVisibility(profileId, section, visibility);
      set((state) => ({
        settings: state.settings
          ? {
              ...state.settings,
              sections: { ...state.settings.sections, [section]: visibility },
            }
          : null,
        loading: false,
      }));
    } catch {
      set({ error: 'Error al actualizar visibilidad', loading: false });
    }
  },

  updateSeoSettings: async (profileId: string, seo: { title: string; description: string }) => {
    set({ loading: true, error: null });
    try {
      await visibilityService.updateSeoSettings(profileId, seo);
      set((state) => ({
        settings: state.settings ? { ...state.settings, seo } : null,
        loading: false,
      }));
    } catch {
      set({ error: 'Error al actualizar SEO', loading: false });
    }
  },

  updatePasswordProtection: async (profileId: string, enabled: boolean, password?: string) => {
    set({ loading: true, error: null });
    try {
      await visibilityService.updatePasswordProtection(profileId, enabled, password);
      set((state) => ({
        settings: state.settings
          ? { ...state.settings, isPasswordProtected: enabled, password }
          : null,
        loading: false,
      }));
    } catch {
      set({ error: 'Error al actualizar protección', loading: false });
    }
  },

  fetchPublicPortfolio: async (slug: string) => {
    set({ loading: true, error: null });
    try {
      const publicPortfolio = await visibilityService.getPublicPortfolio(slug);
      set({ publicPortfolio, loading: false });
    } catch {
      set({ error: 'Portafolio no encontrado', loading: false });
    }
  },

  verifyPassword: async (slug: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const valid = await visibilityService.verifyPassword(slug, password);
      set({ loading: false });
      return valid;
    } catch {
      set({ error: 'Error al verificar contraseña', loading: false });
      return false;
    }
  },

  fetchPublicPortfolios: async () => {
    set({ loading: true, error: null });
    try {
      const publicPortfolios = await visibilityService.getPublicPortfolios();
      set({ publicPortfolios, loading: false });
    } catch {
      set({ error: 'Error al cargar portafolios', loading: false });
    }
  },

  fetchModerationHistory: async (portfolioId: string) => {
    set({ loading: true, error: null });
    try {
      const moderationHistory = await visibilityService.getModerationHistory(portfolioId);
      set({ moderationHistory, loading: false });
    } catch {
      set({ error: 'Error al cargar historial', loading: false });
    }
  },

  moderatePortfolio: async (portfolioId: string, action: ModerationAction['actionType'], reason?: string) => {
    set({ loading: true, error: null });
    try {
      await visibilityService.moderatePortfolio(portfolioId, action, reason);
      set({ loading: false });
    } catch {
      set({ error: 'Error al moderar portafolio', loading: false });
    }
  },
}));

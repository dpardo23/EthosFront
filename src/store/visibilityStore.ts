import { create } from 'zustand';
import type {
  VisibilitySettings,
  SectionVisibility,
  PortfolioSection,
  ModerationAction,
  User,
} from '@/shared/types';
import { visibilityService } from '@/shared/services';

interface VisibilityStore {
  settings: VisibilitySettings | null;
  publicPortfolio: { user: User; settings: VisibilitySettings } | null;
  publicPortfolios: { user: User; settings: VisibilitySettings }[];
  moderationHistory: ModerationAction[];
  slugAvailability: { available: boolean; reason?: string } | null;
  loading: boolean;
  error: string | null;
  fetchSettings: (userId: string) => Promise<void>;
  checkSlugAvailability: (slug: string) => Promise<void>;
  updateSlug: (userId: string, slug: string) => Promise<void>;
  updateSectionVisibility: (userId: string, section: PortfolioSection, visibility: SectionVisibility) => Promise<void>;
  updateSeoSettings: (userId: string, seo: { title: string; description: string }) => Promise<void>;
  updatePasswordProtection: (userId: string, enabled: boolean, password?: string) => Promise<void>;
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

  fetchSettings: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const settings = await visibilityService.getSettings(userId);
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

  updateSlug: async (userId: string, slug: string) => {
    set({ loading: true, error: null });
    try {
      await visibilityService.updateSlug(userId, slug);
      set((state) => ({
        settings: state.settings ? { ...state.settings, slug } : null,
        loading: false,
      }));
    } catch {
      set({ error: 'Error al actualizar slug', loading: false });
    }
  },

  updateSectionVisibility: async (userId: string, section: PortfolioSection, visibility: SectionVisibility) => {
    set({ loading: true, error: null });
    try {
      await visibilityService.updateSectionVisibility(userId, section, visibility);
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

  updateSeoSettings: async (userId: string, seo: { title: string; description: string }) => {
    set({ loading: true, error: null });
    try {
      await visibilityService.updateSeoSettings(userId, seo);
      set((state) => ({
        settings: state.settings ? { ...state.settings, seo } : null,
        loading: false,
      }));
    } catch {
      set({ error: 'Error al actualizar SEO', loading: false });
    }
  },

  updatePasswordProtection: async (userId: string, enabled: boolean, password?: string) => {
    set({ loading: true, error: null });
    try {
      await visibilityService.updatePasswordProtection(userId, enabled, password);
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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfilePreferences, Language, PortfolioSection } from '@/shared/types';
import { preferencesService } from '@/shared/services/preferencesService';

/**
 * Zustand store for profile preferences persisted in core.profile_preferences
 * through the backend. Updates are optimistic with rollback on failure.
 */
interface PreferencesStore {
  preferences: ProfilePreferences | null;
  loading: boolean;
  error: string | null;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<ProfilePreferences>) => Promise<void>;
  updateLanguage: (language: Language) => Promise<void>;
  updateSectionOrder: (order: PortfolioSection[]) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: null,
      loading: false,
      error: null,

      fetchPreferences: async () => {
        set({ loading: true, error: null });
        try {
          const preferences = await preferencesService.getPreferences();
          set({ preferences, loading: false });
        } catch {
          set({ error: 'Error al cargar preferencias', loading: false });
        }
      },

      updatePreferences: async (updates: Partial<ProfilePreferences>) => {
        const currentPreferences = get().preferences;
        set({
          preferences: currentPreferences ? { ...currentPreferences, ...updates } : null,
          loading: true,
          error: null,
        });
        try {
          const preferences = await preferencesService.updatePreferences(updates);
          set({ preferences, loading: false });
        } catch {
          set({
            preferences: currentPreferences,
            error: 'Error al actualizar preferencias',
            loading: false,
          });
        }
      },

      updateLanguage: async (language: Language) => {
        await get().updatePreferences({ language });
      },

      updateSectionOrder: async (order: PortfolioSection[]) => {
        await get().updatePreferences({ sectionOrder: order });
      },
    }),
    {
      name: 'ethoshub_preferences',
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);

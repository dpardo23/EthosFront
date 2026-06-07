import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfilePreferences, Language, PortfolioSection } from '@/shared/types';
import { preferencesService } from '@/shared/services';

interface PreferencesStore {
  preferences: ProfilePreferences | null;
  loading: boolean;
  error: string | null;
  fetchPreferences: (profileId: string) => Promise<void>;
  updatePreferences: (updates: Partial<ProfilePreferences>) => Promise<void>;
  updateLanguage: (language: Language) => Promise<void>;
  updateSectionOrder: (order: PortfolioSection[]) => Promise<void>;
  updatePreference: (key: keyof ProfilePreferences, value: unknown) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: null,
      loading: false,
      error: null,

      fetchPreferences: async (profileId: string) => {
        set({ loading: true, error: null });
        try {
          const preferences = await preferencesService.getPreferences(profileId);
          set({ preferences, loading: false });
        } catch {
          set({ error: 'Error al cargar preferencias', loading: false });
        }
      },

      updatePreferences: async (updates: Partial<ProfilePreferences>) => {
        const currentPreferences = get().preferences;
        // Optimistic update before API call
        set({
          preferences: currentPreferences ? { ...currentPreferences, ...updates } : null,
          loading: true,
          error: null,
        });
        try {
          await Promise.all(
            Object.entries(updates).map(([key, value]) =>
              preferencesService.updatePreference(key as keyof ProfilePreferences, value)
            )
          );
          set({ loading: false });
        } catch {
          // Rollback
          if (currentPreferences) {
            set({ preferences: currentPreferences, error: 'Error al actualizar preferencias', loading: false });
          } else {
            set({ error: 'Error al actualizar preferencias', loading: false });
          }
        }
      },

      updateLanguage: async (language: Language) => {
        set({ loading: true, error: null });
        try {
          await preferencesService.updateLanguage(language);
          set((state) => ({
            preferences: state.preferences
              ? { ...state.preferences, language }
              : null,
            loading: false,
          }));
        } catch {
          set({ error: 'Error al actualizar idioma', loading: false });
        }
      },

      updateSectionOrder: async (order: PortfolioSection[]) => {
        set({ loading: true, error: null });
        try {
          await preferencesService.updateSectionOrder(order);
          set((state) => ({
            preferences: state.preferences
              ? { ...state.preferences, sectionOrder: order }
              : null,
            loading: false,
          }));
        } catch {
          set({ error: 'Error al actualizar orden', loading: false });
        }
      },

      updatePreference: async (key: keyof ProfilePreferences, value: unknown) => {
        set({ loading: true, error: null });
        try {
          await preferencesService.updatePreference(key, value);
          const { preferences } = get();
          if (preferences) {
            set({
              preferences: { ...preferences, [key]: value },
              loading: false,
            });
          }
        } catch {
          set({ error: 'Error al actualizar preferencia', loading: false });
        }
      },
    }),
    {
      name: 'ethoshub_preferences',
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);

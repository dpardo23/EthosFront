import { create } from 'zustand';
import {
  portfolioService,
  type PortfolioSettings,
  type AvailableItems,
  type UpdateSettingsRequest,
} from '@/shared/services/portfolioService';

interface PortfolioState {
  settings: PortfolioSettings | null;
  availableItems: AvailableItems | null;
  loadingSettings: boolean;
  loadingItems: boolean;
  saving: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  updateSettings: (req: UpdateSettingsRequest) => Promise<void>;
  fetchAvailableItems: () => Promise<void>;
  toggleItem: (
    itemType: 'project' | 'experience' | 'education' | 'hard_skill' | 'soft_skill',
    itemId: string
  ) => Promise<void>;
  setAllItemsForType: (
    itemType: 'project' | 'experience' | 'education' | 'hard_skill' | 'soft_skill',
    itemIds: string[]
  ) => Promise<void>;
  reset: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  settings: null,
  availableItems: null,
  loadingSettings: false,
  loadingItems: false,
  saving: false,
  error: null,

  fetchSettings: async () => {
    set({ loadingSettings: true, error: null });
    try {
      const settings = await portfolioService.getSettings();
      set({ settings });
    } catch {
      set({ error: 'No se pudieron cargar los ajustes del portafolio' });
    } finally {
      set({ loadingSettings: false });
    }
  },

  updateSettings: async (req) => {
    const prev = get().settings;
    // Optimistic update
    set({ saving: true, settings: prev ? { ...prev, ...req } : prev });
    try {
      await portfolioService.updateSettings(req);
      const fresh = await portfolioService.getSettings();
      set({ settings: fresh });
    } catch {
      set({ settings: prev, error: 'No se pudieron guardar los ajustes' });
    } finally {
      set({ saving: false });
    }
  },

  fetchAvailableItems: async () => {
    set({ loadingItems: true, error: null });
    try {
      const availableItems = await portfolioService.getAvailableItems();
      set({ availableItems });
    } catch {
      set({ error: 'No se pudieron cargar los elementos disponibles' });
    } finally {
      set({ loadingItems: false });
    }
  },

  toggleItem: async (itemType, itemId) => {
    const { availableItems, settings } = get();
    if (!availableItems) return;

    // Compute new selected ids for this type
    const typeKey = itemType === 'project' ? 'projects'
      : itemType === 'experience' ? 'experiences'
      : itemType === 'education' ? 'education'
      : itemType === 'hard_skill' ? 'hardSkills'
      : 'softSkills';

    const items = availableItems[typeKey] as Array<{ id: string; isSelected: boolean; displayOrder: number }>;
    const wasSelected = items.find(i => i.id === itemId)?.isSelected ?? false;

    // Optimistic update on availableItems
    const updatedItems = items.map(i =>
      i.id === itemId ? { ...i, isSelected: !wasSelected } : i
    );
    const newAvailable = { ...availableItems, [typeKey]: updatedItems };
    set({ availableItems: newAvailable });

    // All currently selected ids in order
    const selectedIds = updatedItems
      .filter(i => i.isSelected)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(i => i.id);

    try {
      await portfolioService.updateItems({ itemType, itemIds: selectedIds });
      // Refresh settings (for selectedItems count)
      if (settings) {
        const fresh = await portfolioService.getSettings();
        set({ settings: fresh });
      }
    } catch {
      // Revert optimistic update
      set({ availableItems, error: 'No se pudo actualizar la selección' });
    }
  },

  setAllItemsForType: async (itemType, itemIds) => {
    const { availableItems, settings } = get();
    try {
      set({ saving: true });
      await portfolioService.updateItems({ itemType, itemIds });
      if (availableItems) {
        const fresh = await portfolioService.getAvailableItems();
        set({ availableItems: fresh });
      }
      if (settings) {
        const freshSettings = await portfolioService.getSettings();
        set({ settings: freshSettings });
      }
    } catch {
      set({ error: 'No se pudo actualizar la selección' });
    } finally {
      set({ saving: false });
    }
  },

  reset: () => set({ settings: null, availableItems: null, error: null }),
}));

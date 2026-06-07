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
    // Optimistic update solo para campos no-slug (el slug se confirma desde el servidor)
    const optimistic = req.slug !== undefined
      ? prev  // para slug, esperar respuesta del servidor
      : prev ? { ...prev, ...req } : prev;
    set({ saving: true, settings: optimistic, error: null });
    try {
      await portfolioService.updateSettings(req);
      const fresh = await portfolioService.getSettings();
      set({ settings: fresh });
    } catch (e: unknown) {
      const msg = (e as any)?.response?.data?.message
        ?? (e as any)?.message
        ?? 'No se pudieron guardar los ajustes';
      set({ settings: prev, error: msg });
      throw e;
    } finally {
      set({ saving: false });
    }
  },

  fetchAvailableItems: async () => {
    // No resetear availableItems a null para evitar parpadeo en refrescos
    set({ loadingItems: true, error: null });
    try {
      const availableItems = await portfolioService.getAvailableItems();
      set({ availableItems, error: null });
    } catch (e: unknown) {
      const msg = (e as any)?.response?.data?.message
        ?? (e as any)?.message
        ?? 'No se pudieron cargar los elementos disponibles';
      set({ error: msg });
    } finally {
      set({ loadingItems: false });
    }
  },

  toggleItem: async (itemType, itemId) => {
    const { availableItems } = get();
    if (!availableItems) return;

    const typeKey = itemType === 'project' ? 'projects'
      : itemType === 'experience' ? 'experiences'
      : itemType === 'education' ? 'education'
      : itemType === 'hard_skill' ? 'hardSkills'
      : 'softSkills';

    const items = availableItems[typeKey] as Array<{ id: string; isSelected: boolean; displayOrder: number }>;
    const wasSelected = items.find(i => i.id === itemId)?.isSelected ?? false;

    // Optimistic update — marcar inmediatamente sin esperar al servidor
    const updatedItems = items.map(i =>
      i.id === itemId ? { ...i, isSelected: !wasSelected } : i
    );
    const newAvailable = { ...availableItems, [typeKey]: updatedItems };

    // Actualizar el contador en settings también de forma optimista
    const { settings } = get();
    let newSettings = settings;
    if (settings) {
      const newCount = updatedItems.filter(i => i.isSelected).length;
      const updatedSelectedItems = updatedItems
        .filter(i => i.isSelected)
        .map(i => ({ itemType, itemId: i.id, displayOrder: i.displayOrder }));
      const otherItems = settings.selectedItems.filter(s => s.itemType !== itemType);
      newSettings = { ...settings, selectedItems: [...otherItems, ...updatedSelectedItems] };
    }

    set({ availableItems: newAvailable, settings: newSettings });

    // All currently selected ids in order
    const selectedIds = updatedItems
      .filter(i => i.isSelected)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(i => i.id);

    try {
      await portfolioService.updateItems({ itemType, itemIds: selectedIds });
    } catch {
      // Revertir en caso de error
      set({ availableItems, settings, error: 'No se pudo actualizar la selección' });
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

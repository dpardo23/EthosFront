import { create } from 'zustand';
import { skillsService } from '@/shared/services';
import type { HardSkill, SoftSkill, GlobalSkillTag, SkillLevel, SkillCategory } from '@/shared/types';

interface SkillsStore {
  hardSkills: HardSkill[];
  softSkills: SoftSkill[];
  searchResults: GlobalSkillTag[];
  loading: boolean;
  error: string | null;

  fetchHardSkills: (profileId: string) => Promise<void>;
  fetchSoftSkills: (profileId: string) => Promise<void>;
  searchTags: (query: string) => Promise<void>;
  addHardSkill: (profileId: string, tagId: string, level: SkillLevel) => Promise<void>;
  updateHardSkill: (profileId: string, skillId: string, level: SkillLevel) => Promise<void>;
  removeHardSkill: (profileId: string, skillId: string) => Promise<void>;
  createTag: (name: string, category: SkillCategory) => Promise<GlobalSkillTag>;
  addSoftSkill: (profileId: string, title: string, description?: string) => Promise<void>;
  updateSoftSkill: (skillId: string, title: string, description?: string) => Promise<void>;
  removeSoftSkill: (profileId: string, skillId: string) => Promise<void>;
  toggleTopSkill: (profileId: string, skillId: string) => Promise<void>;
  reorderTopSkills: (profileId: string, skillIds: string[]) => Promise<void>;
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  hardSkills: [],
  softSkills: [],
  searchResults: [],
  loading: false,
  error: null,

  fetchHardSkills: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      const skills = await skillsService.getHardSkills(profileId);
      set({ hardSkills: skills });
    } catch (e: any) {
      set({ error: e.message ?? 'Error al cargar habilidades' });
    } finally {
      set({ loading: false });
    }
  },

  fetchSoftSkills: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      const skills = await skillsService.getSoftSkills(profileId);
      set({ softSkills: skills });
    } catch (e: any) {
      set({ error: e.message ?? 'Error al cargar habilidades blandas' });
    } finally {
      set({ loading: false });
    }
  },

  searchTags: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const results = await skillsService.searchTags(query);
      // Exclude tags already added
      const existing = get().hardSkills.map(s => s.skillTag.id);
      set({ searchResults: results.filter(t => !existing.includes(t.id)) });
    } catch {
      set({ searchResults: [] });
    }
  },

  addHardSkill: async (profileId: string, tagId: string, level: SkillLevel) => {
    const { toast } = await import('sonner');
    try {
      const skill = await skillsService.addHardSkill(profileId, tagId, level);
      set(s => ({ hardSkills: [...s.hardSkills, skill] }));
      toast.success('Habilidad agregada');
    } catch (e: any) {
      toast.error(e?.message || 'Error al agregar habilidad');
      throw e;
    }
  },

  updateHardSkill: async (_profileId: string, skillId: string, level: SkillLevel) => {
    const { toast } = await import('sonner');
    try {
      const updated = await skillsService.updateHardSkill(skillId, level);
      set(s => ({
        hardSkills: s.hardSkills.map(h => h.id === skillId ? { ...h, ...updated } : h),
      }));
      toast.success('Nivel actualizado');
    } catch (e: any) {
      toast.error(e?.message || 'Error al actualizar habilidad');
      throw e;
    }
  },

  createTag: async (name: string, category: SkillCategory) => {
    return skillsService.createTag(name, category);
  },

  removeHardSkill: async (_profileId: string, skillId: string) => {
    const { toast } = await import('sonner');
    const snapshot = useSkillsStore.getState().hardSkills;
    set(s => ({ hardSkills: s.hardSkills.filter(h => h.id !== skillId) }));
    try {
      await skillsService.removeHardSkill(skillId);
      toast.success('Habilidad eliminada');
    } catch (e: any) {
      set({ hardSkills: snapshot });
      toast.error(e?.message || 'Error al eliminar habilidad');
    }
  },

  addSoftSkill: async (profileId: string, title: string, description?: string) => {
    const { toast } = await import('sonner');
    try {
      const skill = await skillsService.addSoftSkill(profileId, title, description);
      set(s => ({ softSkills: [...s.softSkills, skill] }));
      toast.success('Habilidad blanda agregada');
    } catch (e: any) {
      toast.error(e?.message || 'Error al agregar habilidad');
      throw e;
    }
  },

  updateSoftSkill: async (skillId: string, title: string, description?: string) => {
    const { toast } = await import('sonner');
    try {
      const updated = await skillsService.updateSoftSkill(skillId, title, description);
      set(s => ({
        softSkills: s.softSkills.map(sk => sk.id === skillId ? { ...sk, ...updated } : sk),
      }));
      toast.success('Habilidad actualizada');
    } catch (e: any) {
      toast.error(e?.message || 'Error al actualizar habilidad');
      throw e;
    }
  },

  removeSoftSkill: async (_profileId: string, skillId: string) => {
    const { toast } = await import('sonner');
    const snapshot = useSkillsStore.getState().softSkills;
    set(s => ({ softSkills: s.softSkills.filter(sk => sk.id !== skillId) }));
    try {
      await skillsService.removeSoftSkill(skillId);
      toast.success('Habilidad eliminada');
    } catch (e: any) {
      set({ softSkills: snapshot });
      toast.error(e?.message || 'Error al eliminar habilidad');
    }
  },

  toggleTopSkill: async (_profileId: string, skillId: string) => {
    const { toast } = await import('sonner');
    try {
      const updated = await skillsService.toggleTopSkill(skillId);
      set(s => ({
        hardSkills: s.hardSkills.map(h => h.id === skillId ? { ...h, ...updated } : h),
      }));
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo actualizar. Máximo 3 habilidades destacadas.');
    }
  },

  reorderTopSkills: async (profileId: string, skillIds: string[]) => {
    const updated = await skillsService.reorderTopSkills(profileId, skillIds);
    set({ hardSkills: updated });
  },
}));

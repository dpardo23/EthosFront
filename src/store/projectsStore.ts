/**
 * projectsStore.ts  (actualizado – HU GAN-001)
 *
 * Cambio principal: createProject ahora retorna Promise<Project>
 * para que CreateProjectModal pueda redirigir al detalle del proyecto recién creado.
 *
 * CA-6: Si el servicio lanza un error el store NO modifica la lista de proyectos,
 *       garantizando que no queden datos inconsistentes.
 */

import { create } from 'zustand';
import type { Project } from '@/shared/types';
import { projectsService } from '@/shared/services';

interface ProjectsStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  fetchProjects: (profileId: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<Project | null>;
  fetchPublicProjects: (profileId: string) => Promise<void>;

  /** CA-8 + CA-9: Genera ID único, vincula al usuario y registra fechas automáticamente. */
  createProject: (profileId: string, data: Partial<Project>) => Promise<Project>;

  updateProject: (projectId: string, data: Partial<Project>, profileId?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  clearCurrentProject: () => void;
}

export const useProjectsStore = create<ProjectsStore>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  // ──────────────────────────────────────────────
  // READ
  // ──────────────────────────────────────────────

  fetchProjects: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      const projects = await projectsService.getProjects(profileId);
      set({ projects, loading: false });
    } catch {
      set({ error: 'Error al cargar proyectos', loading: false });
    }
  },

  fetchProject: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const currentProject = await projectsService.getProject(projectId);
      set({ currentProject, loading: false });
      return currentProject;
    } catch {
      set({ error: 'Error al cargar proyecto', loading: false });
      return null;
    }
  },

  fetchPublicProjects: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      const projects = await projectsService.getPublicProjects(profileId);
      set({ projects, loading: false });
    } catch {
      set({ error: 'Error al cargar proyectos', loading: false });
    }
  },

  // ──────────────────────────────────────────────
  // CREATE  (HU GAN-001)
  // ──────────────────────────────────────────────

  /**
   * CA-8:  El servicio genera un ID único y vincula el proyecto al usuario creador.
   * CA-9:  El servicio asigna createdAt / updatedAt en el momento de persistencia.
   * CA-6:  Si el servicio falla se lanza la excepción SIN mutar el estado local,
   *        por lo que no quedan datos parciales en la lista de proyectos.
   * CA-10: El componente gestiona el guard de doble-clic; el store sólo procesa
   *        la llamada que llegue.
   *
   * @returns El proyecto recién creado para permitir la redirección post-creación.
   */
  createProject: async (profileId: string, data: Partial<Project>): Promise<Project> => {
    set({ loading: true, error: null });
    try {
      const newProject = await projectsService.createProject(profileId, data);
      set((state) => ({
        projects: [...state.projects, newProject],
        loading: false,
      }));
      return newProject;
    } catch (err) {
      // CA-6: Revertir loading sin modificar la lista → sin datos inconsistentes
      set({ error: 'Error al crear proyecto', loading: false });
      throw err; // Re-lanzar para que el componente muestre el toast de error
    }
  },

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────

    updateProject: async (projectId: string, data: Partial<Project>, profileId?: string) => {
    // Optimistic update: apply changes immediately so UI reflects edits even if API is unavailable
    const optimistic = { ...data, updatedAt: new Date().toISOString() };
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...optimistic } : p
      ),
      currentProject:
        state.currentProject?.id === projectId
          ? { ...state.currentProject, ...optimistic }
          : state.currentProject,
      loading: true,
      error: null,
    }));
    try {
      const updatedProject = await projectsService.updateProject(projectId, data, profileId || '');
      set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? updatedProject : p),
        currentProject:
          state.currentProject?.id === projectId ? updatedProject : state.currentProject,
        loading: false,
      }));
    } catch {
      // Keep optimistic update on failure (local-first: works with mock data & offline)
      set({ loading: false });
    }
  },

  // ──────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────

  deleteProject: async (projectId: string) => {
    // Optimistic delete: remove immediately from local state so UI responds instantly
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProject:
        state.currentProject?.id === projectId ? null : state.currentProject,
      loading: true,
      error: null,
    }));
    try {
      await projectsService.deleteProject(projectId);
      set({ loading: false });
    } catch {
      // Keep optimistic delete on failure (local-first: works with mock data & offline)
      set({ loading: false });
    }
  },

  // ──────────────────────────────────────────────
  // MISC
  // ──────────────────────────────────────────────

  clearCurrentProject: () => {
    set({ currentProject: null });
  },
}));
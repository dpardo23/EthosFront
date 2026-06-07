

import { create } from 'zustand';
import type { Project } from '@/shared/types';
import { projectsService } from '@/shared/services';

/**
 * Zustand store managing the professional's project list; handles CRUD operations and syncs with the backend projects API.
 */
interface ProjectsStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  fetchProjects: (profileId: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<Project | null>;
  fetchPublicProjects: (profileId: string) => Promise<void>;

  
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
      
      set({ error: 'Error al crear proyecto', loading: false });
      throw err; 
    }
  },

  
  
  

    updateProject: async (projectId: string, data: Partial<Project>, profileId?: string) => {
    
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
      
      set({ loading: false });
    }
  },

  
  
  

  deleteProject: async (projectId: string) => {
    const { toast } = await import('sonner');
    const { projects, currentProject } = useProjectsStore.getState();
    
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
      error: null,
    }));
    try {
      await projectsService.deleteProject(projectId);
      toast.success('Proyecto eliminado correctamente');
    } catch (err: any) {
      
      set({ projects, currentProject: currentProject ?? null });
      toast.error(err?.message || 'Error al eliminar el proyecto');
    }
  },

  
  
  

  clearCurrentProject: () => {
    set({ currentProject: null });
  },
}));
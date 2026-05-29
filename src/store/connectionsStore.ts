import { create } from 'zustand';
import type {
  OAuthConnection,
  GithubRepository,
  GithubHeatmapDay,
  LinkedinExperience,
  LinkedinEducation,
  Recommendation,
} from '@/shared/types';
import { connectionsService } from '@/shared/services';

interface ConnectionsStore {
  connections: OAuthConnection[];
  githubRepos: GithubRepository[];
  githubHeatmap: GithubHeatmapDay[];
  linkedinExperiences: LinkedinExperience[];
  linkedinEducations: LinkedinEducation[];
  recommendations: Recommendation[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  fetchConnections: (userId: string) => Promise<void>;
  syncAll: (userId: string) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  reconnect: (connectionId: string) => Promise<void>;
  fetchGithubRepos: () => Promise<void>;
  fetchGithubHeatmap: () => Promise<void>;
  importGithubRepos: (repoIds: string[]) => Promise<void>;
  fetchLinkedinData: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  importLinkedinData: () => Promise<void>;
  toggleRecommendationPublic: (id: string) => void;
}

export const useConnectionsStore = create<ConnectionsStore>((set, get) => ({
  connections: [],
  githubRepos: [],
  githubHeatmap: [],
  linkedinExperiences: [],
  linkedinEducations: [],
  recommendations: [],
  loading: false,
  syncing: false,
  error: null,

  fetchConnections: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const connections = await connectionsService.getConnections(userId);
      set({ connections, loading: false });
    } catch {
      set({ error: 'Error al cargar conexiones', loading: false });
    }
  },

  syncAll: async (userId: string) => {
    set({ syncing: true, error: null });
    try {
      await connectionsService.syncAll(userId);
      await get().fetchConnections(userId);
      set({ syncing: false });
    } catch {
      set({ error: 'Error al sincronizar', syncing: false });
    }
  },

  disconnect: async (connectionId: string) => {
    set({ loading: true, error: null });
    try {
      await connectionsService.disconnect(connectionId);
      set((state) => ({
        connections: state.connections.map((c) =>
          c.id === connectionId ? { ...c, status: 'disconnected' as const } : c
        ),
        loading: false,
      }));
    } catch {
      set({ error: 'Error al desconectar', loading: false });
    }
  },

  reconnect: async (connectionId: string) => {
    set({ loading: true, error: null });
    try {
      const updatedConnection = await connectionsService.reconnect(connectionId);
      set((state) => ({
        connections: state.connections.map((c) =>
          c.id === connectionId ? updatedConnection : c
        ),
        loading: false,
      }));
    } catch {
      set({ error: 'Error al reconectar', loading: false });
    }
  },

  fetchGithubRepos: async () => {
    set({ loading: true, error: null });
    try {
      const githubRepos = await connectionsService.getGithubRepos();
      set({ githubRepos, loading: false });
    } catch {
      set({ error: 'Error al cargar repositorios', loading: false });
    }
  },

  fetchGithubHeatmap: async () => {
    set({ loading: true, error: null });
    try {
      const githubHeatmap = await connectionsService.getGithubHeatmap();
      set({ githubHeatmap, loading: false });
    } catch {
      set({ error: 'Error al cargar heatmap', loading: false });
    }
  },

  importGithubRepos: async (repoIds: string[]) => {
    set({ loading: true, error: null });
    try {
      await connectionsService.importGithubRepos(repoIds);
      set((state) => ({
        githubRepos: state.githubRepos.map((r) =>
          repoIds.includes(r.id) ? { ...r, isImported: true } : r
        ),
        loading: false,
      }));
    } catch {
      set({ error: 'Error al importar repositorios', loading: false });
    }
  },

  fetchLinkedinData: async () => {
    set({ loading: true, error: null });
    try {
      const [experiences, educations] = await Promise.all([
        connectionsService.getLinkedinExperiences(),
        connectionsService.getLinkedinEducations(),
      ]);
      set({
        linkedinExperiences: experiences,
        linkedinEducations: educations,
        loading: false,
      });
    } catch {
      set({ error: 'Error al cargar datos de LinkedIn', loading: false });
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true, error: null });
    try {
      const recommendations = await connectionsService.getRecommendations();
      set({ recommendations, loading: false });
    } catch {
      set({ error: 'Error al cargar recomendaciones', loading: false });
    }
  },

  importLinkedinData: async () => {
    set({ loading: true, error: null });
    try {
      await connectionsService.importLinkedinData();
      set({ loading: false });
    } catch {
      set({ error: 'Error al importar datos', loading: false });
    }
  },

  toggleRecommendationPublic: (id: string) => {
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, isPublic: !r.isPublic } : r
      ),
    }));
  },
}));

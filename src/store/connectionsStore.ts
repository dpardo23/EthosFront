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

/**
 * Zustand store for external connections CRUD (GitHub, LinkedIn, etc.) shown on the public portfolio.
 */
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
  fetchConnections: (profileId: string) => Promise<void>;
  addConnection: (provider: string, profileHandle?: string, providerUrl?: string) => Promise<void>;
  syncAll: (profileId: string) => Promise<void>;
  syncConnection: (connectionId: string) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  reconnect: (connectionId: string) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
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

  fetchConnections: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      const connections = await connectionsService.getConnections(profileId);
      set({ connections, loading: false });
    } catch {
      set({ error: 'Error al cargar conexiones', loading: false });
    }
  },

  addConnection: async (provider: string, profileHandle?: string, providerUrl?: string) => {
    set({ loading: true, error: null });
    try {
      const created = await connectionsService.addConnection(provider, profileHandle, providerUrl);
      set((state) => ({
        connections: state.connections.some((c) => c.id === created.id)
          ? state.connections.map((c) => (c.id === created.id ? created : c))
          : [...state.connections, created],
        loading: false,
      }));
    } catch {
      set({ error: 'Error al agregar conexión', loading: false });
      throw new Error('Error al agregar conexión');
    }
  },

  syncAll: async (profileId: string) => {
    set({ syncing: true, error: null });
    try {
      await connectionsService.syncAll(profileId);
      await get().fetchConnections(profileId);
      set({ syncing: false });
    } catch {
      set({ error: 'Error al sincronizar', syncing: false });
    }
  },

  syncConnection: async (connectionId: string) => {
    set({ loading: true, error: null });
    try {
      const updated = await connectionsService.sync(connectionId);
      set((state) => ({
        connections: state.connections.map((c) => (c.id === connectionId ? updated : c)),
        loading: false,
      }));
    } catch {
      set({ error: 'Error al sincronizar', loading: false });
    }
  },

  disconnect: async (connectionId: string) => {
    set({ loading: true, error: null });
    try {
      await connectionsService.disconnect(connectionId);
      set((state) => ({
        connections: state.connections.map((c) =>
          c.id === connectionId ? { ...c, status: 'disconnected' as const, apiHealth: 'down' as const } : c
        ),
        loading: false,
      }));
    } catch {
      set({ error: 'Error al desconectar', loading: false });
      throw new Error('Error al desconectar');
    }
  },

  reconnect: async (connectionId: string) => {
    set({ loading: true, error: null });
    try {
      const updated = await connectionsService.reconnect(connectionId);
      set((state) => ({
        connections: state.connections.map((c) => (c.id === connectionId ? updated : c)),
        loading: false,
      }));
    } catch {
      set({ error: 'Error al reconectar', loading: false });
      throw new Error('Error al reconectar');
    }
  },

  deleteConnection: async (connectionId: string) => {
    set({ loading: true, error: null });
    try {
      await connectionsService.deleteConnection(connectionId);
      set((state) => ({
        connections: state.connections.filter((c) => c.id !== connectionId),
        loading: false,
      }));
    } catch {
      set({ error: 'Error al eliminar conexión', loading: false });
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
      const githubHeatmap = await connectionsService.getGithubHeatmap() as GithubHeatmapDay[];
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
        connectionsService.getLinkedinExperiences() as Promise<LinkedinExperience[]>,
        connectionsService.getLinkedinEducations() as Promise<LinkedinEducation[]>,
      ]);
      set({ linkedinExperiences: experiences, linkedinEducations: educations, loading: false });
    } catch {
      set({ error: 'Error al cargar datos de LinkedIn', loading: false });
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true, error: null });
    try {
      const recommendations = await connectionsService.getRecommendations() as Recommendation[];
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

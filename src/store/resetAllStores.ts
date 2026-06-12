import { useConnectionsStore }  from './connectionsStore';
import { useCvStudioStore }     from './cvStudioStore';
import { useNotificationsStore } from './notificationsStore';
import { usePortfolioStore }    from './portfolioStore';
import { usePreferencesStore }  from './preferencesStore';
import { useProjectsStore }     from './projectsStore';
import { useSkillsStore }       from './skillsStore';

/**
 * Limpia atómicamente todos los stores de Zustand al estado inicial vacío.
 * Llamar desde logout() antes de redirigir al login.
 * uiStore y authStore se resetean por separado (authStore lo llama explícitamente).
 */
export function resetAllStores(): void {
  useConnectionsStore.setState({
    connections: [],
    githubRepos: [],
    githubHeatmap: [],
    linkedinExperiences: [],
    linkedinEducations: [],
    recommendations: [],
    loading: false,
    syncing: false,
    error: null,
  });

  useCvStudioStore.setState({
    documents: [],
    isLoading: false,
    isSaving: false,
    isDeleting: false,
  });

  useNotificationsStore.setState({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  });

  usePortfolioStore.setState({
    settings: null,
    availableItems: null,
    loadingSettings: false,
    loadingItems: false,
    saving: false,
    error: null,
  });

  // preferencesStore usa persist → también limpiamos su storage key
  usePreferencesStore.setState({ preferences: null, loading: false, error: null });
  try { localStorage.removeItem('ethoshub_preferences'); } catch { /* ignore */ }

  useProjectsStore.setState({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
  });

  useSkillsStore.setState({
    hardSkills: [],
    softSkills: [],
    searchResults: [],
    loading: false,
    error: null,
  });
}

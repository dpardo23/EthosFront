import { create } from 'zustand';
import type { PlatformMetrics, ActivityLog, TimeSeriesData } from '@/shared/types';
import { analyticsService } from '@/shared/services';

interface AnalyticsStore {
  metrics: PlatformMetrics | null;
  activityLogs: ActivityLog[];
  timeSeriesData: TimeSeriesData[];
  selectedPeriod: 7 | 30 | 90;
  loading: boolean;
  error: string | null;
  fetchMetrics: () => Promise<void>;
  fetchActivityLogs: (limit?: number) => Promise<void>;
  fetchTimeSeriesData: () => Promise<void>;
  setSelectedPeriod: (period: 7 | 30 | 90) => void;
  refresh: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  metrics: null,
  activityLogs: [],
  timeSeriesData: [],
  selectedPeriod: 30,
  loading: false,
  error: null,

  fetchMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const metrics = await analyticsService.getPlatformMetrics();
      set({ metrics, loading: false });
    } catch {
      set({ error: 'Error al cargar métricas', loading: false });
    }
  },

  fetchActivityLogs: async (limit: number = 10) => {
    set({ loading: true, error: null });
    try {
      const activityLogs = await analyticsService.getRecentActivity(limit);
      set({ activityLogs, loading: false });
    } catch {
      set({ error: 'Error al cargar actividad', loading: false });
    }
  },

  fetchTimeSeriesData: async () => {
    set({ loading: true, error: null });
    try {
      const { selectedPeriod } = get();
      const timeSeriesData = await analyticsService.getTimeSeriesData(selectedPeriod);
      set({ timeSeriesData, loading: false });
    } catch {
      set({ error: 'Error al cargar datos', loading: false });
    }
  },

  setSelectedPeriod: (period: 7 | 30 | 90) => {
    set({ selectedPeriod: period });
    get().fetchTimeSeriesData();
  },

  refresh: async () => {
    const { fetchMetrics, fetchActivityLogs, fetchTimeSeriesData } = get();
    await Promise.all([fetchMetrics(), fetchActivityLogs(), fetchTimeSeriesData()]);
  },
}));

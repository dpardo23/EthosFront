import { apiClient } from './apiClient';
import { WorkExperience } from '../types/experience';

/**
 * API service layer for work experience CRUD.
 */
const ROUTE = '/v1/work-experiences';

const toExperienceArray = (payload: unknown): WorkExperience[] => {
  if (Array.isArray(payload)) return payload as WorkExperience[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const nested = obj.data ?? obj.experiences ?? obj.content ?? obj.items ?? obj.results;
    if (Array.isArray(nested)) return nested as WorkExperience[];
  }
  return [];
};

export const experienceService = {
  getExperiences: async (profileId: string): Promise<WorkExperience[]> => {
    const response = await apiClient.get(`${ROUTE}/profile/${profileId}`);
    return toExperienceArray(response.data);
  },

  addExperience: async (profileId: string, data: Partial<WorkExperience>): Promise<string> => {
    const response = await apiClient.post(ROUTE, { ...data, profileId });
    return response.data;
  },

  updateExperience: async (profileId: string, id: string, data: Partial<WorkExperience>): Promise<void> => {
    await apiClient.put(`${ROUTE}/${id}`, { ...data, profileId });
  },

  deleteExperience: async (profileId: string, id: string): Promise<void> => {
    await apiClient.delete(`${ROUTE}/${id}/profile/${profileId}`);
  },

  reorderExperiences: async (profileId: string, orderedIds: string[]): Promise<void> => {
    await apiClient.patch(`${ROUTE}/profile/${profileId}/reorder`, { orderedIds });
  },
};

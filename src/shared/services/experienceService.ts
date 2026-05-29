import { apiClient } from './apiClient'; 
import { WorkExperience } from '../types/experience';

const ROUTE = '/v1/work-experiences';

export const experienceService = {
  getExperiences: async (profileId: string): Promise<WorkExperience[]> => {
    const response = await apiClient.get(`${ROUTE}/profile/${profileId}`);
    return response.data;
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
  }
};


import { apiClient } from './apiClient'; 
import { WorkExperience } from '../types/experience';

const ROUTE = '/v1/work-experiences';

export const experienceService = {
  getExperiences: async (userId: string): Promise<WorkExperience[]> => {
    const response = await apiClient.get(`${ROUTE}/user/${userId}`);
    return response.data;
  },
  
  addExperience: async (userId: string, data: Partial<WorkExperience>): Promise<string> => {
    const response = await apiClient.post(ROUTE, { ...data, userId });
    return response.data;
  },

  updateExperience: async (userId: string, id: string, data: Partial<WorkExperience>): Promise<void> => {
    await apiClient.put(`${ROUTE}/${id}`, { ...data, userId });
  },

  deleteExperience: async (userId: string, id: string): Promise<void> => {
    await apiClient.delete(`${ROUTE}/${id}/user/${userId}`);
  }
};


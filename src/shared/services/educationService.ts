import { apiClient } from './apiClient'; 
import { AcademicRecord } from '../types/education';

const ROUTE = '/v1/academic-records';

export const educationService = {
  getRecords: async (userId: string): Promise<AcademicRecord[]> => {
    const response = await apiClient.get(`${ROUTE}/user/${userId}`);
    return response.data;
  },
  
  addRecord: async (userId: string, data: Partial<AcademicRecord>): Promise<string> => {
    const response = await apiClient.post(ROUTE, { ...data, userId });
    return response.data;
  },

  updateRecord: async (userId: string, id: string, data: Partial<AcademicRecord>): Promise<void> => {
    await apiClient.put(`${ROUTE}/${id}`, { ...data, userId });
  },

  deleteRecord: async (userId: string, id: string): Promise<void> => {
    await apiClient.delete(`${ROUTE}/${id}/user/${userId}`);
  }
};
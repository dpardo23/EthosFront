import { apiClient } from './apiClient'; 
import { AcademicRecord } from '../types/education';

const ROUTE = '/v1/academic-records';

/**
 * Normaliza cualquier forma de respuesta a un arreglo seguro de registros.
 * El backend puede devolver el arreglo directo, o anidado/paginado
 * (`data`, `records`, `content`, `items`, `results`). Cualquier otra cosa
 * (null, undefined, objeto suelto) colapsa a `[]` para blindar el render.
 */
const toRecordArray = (payload: unknown): AcademicRecord[] => {
  if (Array.isArray(payload)) return payload as AcademicRecord[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const nested = obj.data ?? obj.records ?? obj.content ?? obj.items ?? obj.results;
    if (Array.isArray(nested)) return nested as AcademicRecord[];
  }
  return [];
};

export const educationService = {
  getRecords: async (profileId: string): Promise<AcademicRecord[]> => {
    const response = await apiClient.get(`${ROUTE}/profile/${profileId}`);
    return toRecordArray(response.data);
  },
  
  addRecord: async (profileId: string, data: Partial<AcademicRecord>): Promise<string> => {
    const response = await apiClient.post(ROUTE, { ...data, profileId });
    return response.data;
  },

  updateRecord: async (profileId: string, id: string, data: Partial<AcademicRecord>): Promise<void> => {
    await apiClient.put(`${ROUTE}/${id}`, { ...data, profileId });
  },

  deleteRecord: async (profileId: string, id: string): Promise<void> => {
    await apiClient.delete(`${ROUTE}/${id}/profile/${profileId}`);
  },

  reorderRecords: async (profileId: string, orderedIds: string[]): Promise<void> => {
    await apiClient.patch(`${ROUTE}/profile/${profileId}/reorder`, { orderedIds });
  },
};
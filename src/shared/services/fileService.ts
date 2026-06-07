import { apiClient } from './apiClient';

/**
 * API service layer for file uploads to Supabase Storage via the backend /uploads endpoint.
 */
export interface UploadResult {
  url: string;
  name: string;
  size: number;
}

export const fileService = {
  
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    
    const response = await apiClient.post<{ data: UploadResult }>('/uploads', formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data.data.url;
  },
};

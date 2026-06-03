import { apiClient } from './apiClient';

export interface UploadResult {
  url: string;
  name: string;
  size: number;
}

export const fileService = {
  /**
   * Uploads a file to Supabase Storage via the backend.
   * Returns the public CDN URL. Uses multipart/form-data so the file
   * streams to the server without base64 overhead.
   */
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ data: UploadResult }>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.url;
  },
};

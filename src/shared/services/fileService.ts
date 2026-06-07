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
    // Content-Type must be undefined so axios doesn't send the instance default
    // 'application/json' — the browser then sets multipart/form-data with the correct boundary.
    const response = await apiClient.post<{ data: UploadResult }>('/uploads', formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data.data.url;
  },
};

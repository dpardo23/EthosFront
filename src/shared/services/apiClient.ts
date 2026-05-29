import axios from 'axios';
import { useAuthStore } from '@/store/authStore'; 

const baseURL = (import.meta.env.VITE_API_URL as string) || '/api';

export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ethoshub_access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const authStore = useAuthStore.getState();

      if (authStore.isAuthenticated) {
        authStore.logout().then(() => {
          window.location.href = '/login';
        });
      }
    }
    return Promise.reject(error);
  }
);
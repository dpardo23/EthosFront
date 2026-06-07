import axios, { AxiosError, isCancel } from 'axios';
import { useAuthStore } from '@/store/authStore';

const baseURL = (import.meta.env.VITE_API_URL as string) || '/api';

function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.exp === 'number' && Math.floor(Date.now() / 1000) > decoded.exp;
  } catch {
    return false;
  }
}

export const apiClient = axios.create({
  baseURL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createAbortController = () => new AbortController();

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
  (error: AxiosError) => {
    const authStore = useAuthStore.getState() as ReturnType<typeof useAuthStore.getState> & {
      setLoading?: (loading: boolean) => void;
    };

    const isTimeoutOrAborted = isCancel(error) || error.code === 'ECONNABORTED';
    const status = error.response?.status;

    if (isTimeoutOrAborted || (status !== undefined && status >= 500)) {
      authStore.setLoading?.(false);
    }

    if (status === 401 || status === 403) {
      const token     = localStorage.getItem('ethoshub_access_token');
      const expiresAt = localStorage.getItem('ethoshub_access_expires_at');
      const isExpiredByStore = !token || (!!expiresAt && Date.now() > Number(expiresAt) * 1000);
      const isExpiredByJwt   = token ? isJwtExpired(token) : true;
      if (isExpiredByStore || isExpiredByJwt) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

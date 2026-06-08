import axios, { AxiosError, isCancel } from 'axios';
import { useAuthStore } from '@/store/authStore';

const ACCESS_TOKEN_KEY = 'ethoshub_access_token';
const EXPIRES_AT_KEY   = 'ethoshub_access_expires_at';

function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.exp === 'number' && Math.floor(Date.now() / 1000) > decoded.exp;
  } catch {
    return false;
  }
}

function readToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(ACCESS_TOKEN_KEY);
}

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const createAbortController = () => new AbortController();

apiClient.interceptors.request.use(
  (config) => {
    const token = readToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
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
      const token     = readToken();
      const expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY) ?? localStorage.getItem(EXPIRES_AT_KEY);
      const isExpiredByStore = !token || (!!expiresAt && Date.now() > Number(expiresAt) * 1000);
      const isExpiredByJwt   = token ? isJwtExpired(token) : true;
      if (isExpiredByStore || isExpiredByJwt) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  },
);

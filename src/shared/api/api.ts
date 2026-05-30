import axios, { type AxiosError } from 'axios';

const ACCESS_TOKEN_KEY = 'ethoshub_access_token';
const TOKEN_TYPE_KEY   = 'ethoshub_token_type';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type':  'application/json',
    'Cache-Control': 'no-cache',
    'Pragma':        'no-cache',
  },
});

// ── Request interceptor: inject JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Only inject if the caller did not already set an explicit Authorization header.
    // This prevents overwriting the Supabase OAuth access token with a stale
    // localStorage token during the OAuth callback flow.
    if (!config.headers.Authorization) {
      const token     = localStorage.getItem(ACCESS_TOKEN_KEY);
      const tokenType = localStorage.getItem(TOKEN_TYPE_KEY) || 'Bearer';
      if (token) {
        config.headers.Authorization = `${tokenType} ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle auth errors + timeouts ──────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      // Only trigger global logout when the stored token is genuinely expired.
      // A 401 on a fresh (non-expired) token means the endpoint is unavailable or
      // the backend has a configuration issue — let the caller's .catch() handle it
      // instead of nuking the session and flashing the user to /login.
      const expiresAt = localStorage.getItem('ethoshub_access_expires_at');
      const tokenPresent = !!localStorage.getItem(ACCESS_TOKEN_KEY);
      const isExpired = !tokenPresent || (!!expiresAt && Date.now() > Number(expiresAt) * 1000);

      if (isExpired) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(TOKEN_TYPE_KEY);
        // Notify the app — ProtectedRoute listens and triggers logout + React Router redirect.
        // Never use window.location here: it causes a full page reload (the visible "flash").
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(new Error('La solicitud tardó demasiado. Verifica tu conexión.'));
    }

    if (!error.response) {
      return Promise.reject(new Error('No se pudo conectar con el servidor.'));
    }

    return Promise.reject(error);
  },
);

export default api;

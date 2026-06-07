import axios, { type AxiosError } from 'axios';

/**
 * Axios instance pre-configured with the backend base URL and a request interceptor that attaches the Supabase JWT bearer token to every request.
 */
const ACCESS_TOKEN_KEY  = 'ethoshub_access_token';
const TOKEN_TYPE_KEY    = 'ethoshub_token_type';
const EXPIRES_AT_KEY    = 'ethoshub_access_expires_at';

function readToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(ACCESS_TOKEN_KEY);
}
function readTokenType(): string {
  return sessionStorage.getItem(TOKEN_TYPE_KEY) ?? localStorage.getItem(TOKEN_TYPE_KEY) ?? 'Bearer';
}
function readExpiresAt(): string | null {
  return sessionStorage.getItem(EXPIRES_AT_KEY) ?? localStorage.getItem(EXPIRES_AT_KEY);
}

function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.exp === 'number' && Math.floor(Date.now() / 1000) > decoded.exp;
  } catch {
    return false;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type':  'application/json',
    'Cache-Control': 'no-cache',
    'Pragma':        'no-cache',
  },
});

api.interceptors.request.use(
  (config) => {
    
    
    
    if (!config.headers.Authorization) {
      const token     = readToken();
      const tokenType = readTokenType();
      if (token) {
        config.headers.Authorization = `${tokenType} ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      const token     = readToken();
      const expiresAt = readExpiresAt();

      
      
      
      
      
      
      const isExpiredByStore = !token || (!!expiresAt && Date.now() > Number(expiresAt) * 1000);
      const isExpiredByJwt   = token ? isJwtExpired(token) : true;

      if (isExpiredByStore || isExpiredByJwt) {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_TYPE_KEY);
        sessionStorage.removeItem(EXPIRES_AT_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(TOKEN_TYPE_KEY);
        localStorage.removeItem(EXPIRES_AT_KEY);
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

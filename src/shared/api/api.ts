import axios from 'axios';

// Creamos la instancia de axios con la URL de tu servidor de la U
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR: Se ejecuta antes de CADA petición que hagas al backend
// ... (parte de arriba del archivo igual)

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ethoshub_access_token');
    const tokenType = localStorage.getItem('ethoshub_token_type') || 'Bearer';

    if (token) {
      config.headers.Authorization = `${tokenType} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
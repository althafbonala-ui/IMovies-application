import axios from 'axios';

/**
 * Axios instance configured for iMovies API
 * Communicates between React Frontend and Express Backend
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request Interceptor: Attach JWT Bearer token from localStorage if present
 */
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('imovies_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage access errors in restricted browser contexts
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Automatically clear expired tokens on 401 and notify App.jsx
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      try {
        const hadToken = Boolean(localStorage.getItem('imovies_token'));
        if (hadToken) {
          localStorage.removeItem('imovies_token');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('imovies:auth-expired'));
          }
        }
      } catch {
        // Ignore storage access errors
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Health check service
 * @returns {Promise<object>} API & Database status
 */
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;

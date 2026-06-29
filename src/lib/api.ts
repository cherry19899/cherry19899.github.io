import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://workpro-api.onrender.com';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth header to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('workpro_token');
  const user = localStorage.getItem('workpro_user');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // x-user-id normalization: always add pi_ prefix if not present
  if (user) {
    try {
      const userData = JSON.parse(user);
      let uid = userData.id || userData.uid;
      if (uid && !uid.startsWith('pi_')) {
        uid = `pi_${uid}`;
      }
      if (uid) {
        config.headers['x-user-id'] = uid;
      }
    } catch {
      // ignore
    }
  }

  return config;
});

// Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('workpro_token');
      localStorage.removeItem('workpro_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;

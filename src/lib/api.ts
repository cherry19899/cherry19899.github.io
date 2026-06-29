import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://workpro-api.onrender.com';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth + x-user-id headers to EVERY request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('workpro_token');
  const user = localStorage.getItem('workpro_user');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Always set x-user-id if we have user data (even without token)
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
      // ignore parse error
    }
  }

  return config;
});

// Handle 401 / 403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('workpro_token');
      localStorage.removeItem('workpro_user');
      // Only reload if we're not on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

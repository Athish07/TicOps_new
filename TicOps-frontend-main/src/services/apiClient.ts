import axios from 'axios';
import { env } from '../config/env';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('ticops-auth');
  if (raw) {
    try {
      const auth = JSON.parse(raw) as { token?: string };
      if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ticops-auth');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  },
);

// frontend/src/utils/api.ts
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    // Skip progress bar for silent background requests (e.g. notification polling)
    if (!(config as any)._silent) {
      useUiStore.getState().startRequest();
    }
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (!(error.config as any)?._silent) {
      useUiStore.getState().endRequest();
    }
    return Promise.reject(error);
  }
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => {
    if (!(response.config as any)._silent) {
      useUiStore.getState().endRequest();
    }
    return response;
  },
  (error) => {
    if (!(error.config as any)?._silent) {
      useUiStore.getState().endRequest();
    }

    // Ignore 401s if the user is actively trying to log in (form validation)
    const url = error.config?.url || '';
    const isLoginEndpoint = url.includes('/login') || url.includes('/verify-magic-link');

    if (error.response?.status === 401 && !isLoginEndpoint) {
      const { clearAuth, role, token } = useAuthStore.getState();
      
      if (token?.startsWith('demo_')) {
        return Promise.reject(error);
      }

      clearAuth();

      // Redirect to appropriate login page
      const loginPaths: Record<string, string> = {
        super_admin: '/super-admin',
        admin: '/admin/login',
        user: '/login', // Fallback to /login instead of /portal
        alumni: '/login',
      };
      const loginPath = loginPaths[role || ''] || '/login';
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

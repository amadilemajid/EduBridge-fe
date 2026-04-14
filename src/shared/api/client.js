import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

// In-memory token storage to attach as Bearer (if provided explicitly by login)
// while relying primarily on HttpOnly cookies via withCredentials.
let inMemoryToken = null;

export const setClientToken = (token) => {
  inMemoryToken = token;
};

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // For HttpOnly Cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer token if we have one in memory
apiClient.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Normalise to { success, data } if not already in that format
    if (response.data && response.data.success !== undefined) {
      return response.data;
    }
    return { success: true, data: response.data };
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 Intercept & Redirect
    if (
      error.response?.status === 401 && 
      !originalRequest._isRetry && 
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/merchant/login') &&
      !originalRequest.url.includes('/school/login') &&
      !originalRequest.url.includes('/admin/login')
    ) {
      // --- DEV BYPASS: Prevent aggressive redirect if local UI mock login is active ---
      if (typeof window !== 'undefined' && window.sessionStorage.getItem('dev_bypass') === 'true') {
        return Promise.reject(handleApiError(error));
      }
      
      originalRequest._isRetry = true;
      try {
        await axios.post(
          `${originalRequest.baseURL || 'http://localhost:8000'}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return apiClient(originalRequest);
      } catch (refreshErr) {
        // Refresh failed — signal the app to navigate to login without a hard reload
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          // Already on a login page — don't redirect, just reject
          if (!path.endsWith('/login')) {
            let loginPath = '/parent/login';
            if (path.startsWith('/merchant')) loginPath = '/merchant/login';
            else if (path.startsWith('/school')) loginPath = '/school/login';
            else if (path.startsWith('/admin')) loginPath = '/admin/login';
            // Dispatch a custom event — App.jsx or AuthContext can listen and navigate
            window.dispatchEvent(new CustomEvent('auth:logout', { detail: { redirectTo: loginPath } }));
          }
        }
        return Promise.reject(handleApiError(refreshErr));
      }
    }

    // Normalise error with errorHandler
    return Promise.reject(handleApiError(error));
  }
);

export default apiClient;

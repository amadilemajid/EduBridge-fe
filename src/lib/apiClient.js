import axios from 'axios';

const apiClient = axios.create({
  // The base URL configures against the central Kong API Gateway
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  // Required to send and receive the HttpOnly JWT cookies for session management
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => {
    // EduBridge API responds with { success: true, data: ... }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized globally: Attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/api/v1/auth/login')) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${originalRequest.baseURL || 'http://localhost:8000'}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Token refreshed successfully, retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, token is completely invalid. Redirect to generic login.
        // For a more robust React setup, we would emit an event here instead of direct window.location
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          // IMPORTANT: If already on a login page, DO NOT redirect to break refresh loop
          if (path.endsWith('/login')) return Promise.reject(refreshError);
          
          if (path.startsWith('/merchant')) {
            window.location.href = '/merchant/login';
          } else if (path.startsWith('/school')) {
            window.location.href = '/school/login';
          } else if (path.startsWith('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }
    
    // Pass standard API errors { success, error, message } to caller
    return Promise.reject(error.response?.data || { success: false, message: 'Network Error' });
  }
);

export default apiClient;

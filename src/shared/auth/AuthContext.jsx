/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient, { setClientToken } from '../api/client';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  const clearAutoRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // refreshToken must be defined BEFORE setupAutoRefresh to avoid undefined reference
  const refreshToken = useCallback(async () => {
    try {
      const response = await apiClient.post('/api/v1/auth/refresh');
      const token = response?.data?.access_token || response?.access_token;
      if (token) setClientToken(token);
      return true;
      // eslint-disable-next-line no-unused-vars
    } catch (_) {
      return false;
    }
  }, []);

  // Setup auto refresh 2 minutes before expiry (15m expiry -> 13m interval)
  const setupAutoRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const thirteenMinutes = 13 * 60 * 1000;
    refreshTimerRef.current = setTimeout(refreshToken, thirteenMinutes);
  }, [refreshToken]);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // Determine which /me endpoint to call based on current route
      const path = window.location.pathname;
      let endpoint = '/api/v1/auth/me'; // default for parent/admin/school
      
      if (path.startsWith('/merchant')) {
        // Merchant portal uses supplies-bnpl-service
        endpoint = '/api/v1/merchant/profile';
      }
      
      console.log('[AuthDebug] Restoring session via', endpoint);
      const resp = await apiClient.get(endpoint);
      const userData = resp?.data || resp;
      console.log('[AuthDebug] Session restored:', userData);

      if (!userData || !userData.role) {
        console.warn('[AuthDebug] Session returned success but missing role/data');
        throw new Error('Malformed user data');
      }

      setCurrentUser(userData);
      setRole(userData.role);
      setIsAuthenticated(true);
      setupAutoRefresh();
    } catch (error) {
      console.error('[AuthDebug] Session restore failed:', error?.response?.status, error?.message);
      setCurrentUser(null);
      setRole(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [setupAutoRefresh]);

  // Restore session on initial app mount
  useEffect(() => {
    restoreSession();
    return clearAutoRefresh;
  }, [restoreSession, clearAutoRefresh]);

  // Listen for auth:logout events dispatched by the apiClient on refresh failure
  // This avoids hard page reloads and keeps the React app alive
  useEffect(() => {
    const handler = (e) => {
      setCurrentUser(null);
      setRole(null);
      setIsAuthenticated(false);
      setClientToken(null);
      clearAutoRefresh();
      const redirectTo = e.detail?.redirectTo || '/parent/login';
      window.location.href = redirectTo; // fallback — replaced by navigate in portals
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearAutoRefresh]);

  // ── DEV ONLY ─────────────────────────────────────────────────────────────
  // Sets a mock parent session so ProtectedRoute is satisfied without a real token.
  // Remove or gate behind an env flag before production.
  const devLogin = () => {
    const mockUser = {
      id: 'dev-parent-001',
      full_name: 'Test Parent',
      phone_number: '+256700000000',
      role: 'parent',
      kyc_status: 'verified',
    };
    setCurrentUser(mockUser);
    setRole('parent');
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') window.sessionStorage.setItem('dev_bypass', 'true');
  };
  // ─────────────────────────────────────────────────────────────────────────

  const login = async (credentials, isMerchant = false) => {
    const endpoint = isMerchant ? '/api/v1/merchant/login' : '/api/v1/auth/login';
    try {
      const response = await apiClient.post(endpoint, credentials);
      // The interceptor wraps the response body as { success: true, data: { access_token, ... } }
      const token = response?.data?.access_token || response?.access_token;
      if (token) setClientToken(token);

      // Re-fetch /me to commit the new identity to React state
      await restoreSession();
      return { success: true };
    } catch (error) {
      console.error('[AuthDebug] Login failed:', error);
      return { success: false, message: error?.message || 'Login failed.' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
      // eslint-disable-next-line no-unused-vars
    } catch (_) {
      console.warn('Logout request failed remotely, clearing local state anyway.');
    } finally {
      if (typeof window !== 'undefined') window.sessionStorage.removeItem('dev_bypass');
      setCurrentUser(null);
      setRole(null);
      setIsAuthenticated(false);
      setClientToken(null);
      clearAutoRefresh();

      const path = window.location.pathname;
      if (path.startsWith('/merchant')) window.location.href = '/merchant/login';
      else if (path.startsWith('/school')) window.location.href = '/school/login';
      else if (path.startsWith('/admin')) window.location.href = '/admin/login';
      else window.location.href = '/parent/login';
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      role,
      isAuthenticated,
      isLoading,
      login,
      devLogin,
      logout,
      refreshToken,
      restoreSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);
export { useAuth };

export { AuthContext, AuthProvider };

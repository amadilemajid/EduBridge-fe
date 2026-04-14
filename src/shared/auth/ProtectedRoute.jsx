import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner variant="full" />;
  }

  if (!isAuthenticated) {
    const path = location.pathname;
    const isMerchant = path.startsWith('/merchant');
    const isSchool = path.startsWith('/school');
    const isAdmin = path.startsWith('/admin');
    
    let loginUrl = '/parent/login';
    if (isMerchant) loginUrl = '/merchant/login';
    if (isSchool) loginUrl = '/school/login';
    if (isAdmin) loginUrl = '/admin/login';

    return <Navigate to={loginUrl} replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect authenticated users trying to access the wrong portal to their correct portal home
    if (role === 'school_admin') return <Navigate to="/school" replace />;
    if (role === 'shop_partner') return <Navigate to="/merchant" replace />;
    if (role === 'loan_officer' || role === 'system_admin' || role === 'finance_admin') {
      return <Navigate to="/admin" replace />;
    }
    // Default fallback to parent
    return <Navigate to="/parent" replace />;
  }

  return children;
};

export default ProtectedRoute;

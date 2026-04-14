import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../shared/auth/ProtectedRoute';
import { useAuth } from '../shared/auth/AuthContext';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import LoanApplications from './pages/LoanApplications';
import Collections from './pages/Collections';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import AdminLayout from './components/AdminLayout';

const ADMIN_ROLES = ['loan_officer', 'system_admin', 'finance_admin'];

const RoleBasedRedirect = () => {
  const { role } = useAuth();
  if (role === 'loan_officer') return <Navigate to="applications" replace />;
  if (role === 'finance_admin') return <Navigate to="portfolio" replace />;
  if (role === 'system_admin') return <Navigate to="users" replace />;
  return <Navigate to="login" replace />;
};

const InternalPortalRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleBasedRedirect />} />
        <Route path="portfolio" element={<AdminDashboard />} />
        <Route path="applications" element={<LoanApplications />} />
        <Route path="collections" element={<Collections />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<UserManagement />} />
      </Route>
    </Routes>
  );
};

export default InternalPortalRoutes;

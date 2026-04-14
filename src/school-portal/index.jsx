import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../shared/auth/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Confirmations from './pages/Confirmations';
import Disbursements from './pages/Disbursements';
import Profile from './pages/Profile';
import FeeSchedule from './pages/FeeSchedule';
import Sidebar from './components/Sidebar';

const SchoolPortalRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      
      {/* Protected nested routes using the Sidebar layout */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute allowedRoles={['school_admin']}>
            <Sidebar />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="confirmations" element={<Confirmations />} />
        <Route path="disbursements" element={<Disbursements />} />
        <Route path="fee-schedule" element={<FeeSchedule />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default SchoolPortalRoutes;

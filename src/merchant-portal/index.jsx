import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../shared/auth/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPin from './pages/ForgotPin';
import Dashboard from './pages/Dashboard';
import NewTransaction from './pages/NewTransaction';
import Transactions from './pages/Transactions';
import Disbursements from './pages/Disbursements';
import Profile from './pages/Profile';
import MerchantLayout from './components/MerchantLayout';

const MerchantPortalRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="forgot-pin" element={<ForgotPin />} />

      {/* Protected nested routes using MerchantLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['shop_partner']}>
            <MerchantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transaction/new" element={<NewTransaction />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="disbursements" element={<Disbursements />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default MerchantPortalRoutes;

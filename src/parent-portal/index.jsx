import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../shared/auth/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ParentLayout from './components/ParentLayout';

// Financial & Workflow Features
import FeeLoanApply from './pages/FeeLoanApply';
import SuppliesApply from './pages/SuppliesApply';
import PartnerShops from './pages/PartnerShops';
import SuppliesOTP from './pages/SuppliesOTP';
import Repayments from './pages/Repayments';
import Wallet from './pages/Wallet';
import LoanHistory from './pages/LoanHistory';
import Profile from './pages/Profile';

const ParentPortalRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Loans */}
        <Route path="loans/apply" element={<FeeLoanApply />} />
        <Route path="loans/history" element={<LoanHistory />} />
        
        {/* Supplies */}
        <Route path="supplies/apply" element={<SuppliesApply />} />
        <Route path="supplies/shops" element={<PartnerShops />} />
        <Route path="supplies/transaction" element={<SuppliesOTP />} />
        
        {/* Ledger & Utilities */}
        <Route path="repayments" element={<Repayments />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default ParentPortalRoutes;

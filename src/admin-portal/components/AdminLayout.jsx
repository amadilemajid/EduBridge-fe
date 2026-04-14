import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, AlertTriangle, BarChart3, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../shared/auth/AuthContext';
import apiClient from '../../shared/api/client';

const adminNavLinks = [
  { to: '/admin/applications', icon: FileText, label: 'Application Queue', roles: ['loan_officer', 'system_admin', 'finance_admin'], id: 'applications' },
  { to: '/admin/portfolio', icon: LayoutDashboard, label: 'Portfolio Health', roles: ['loan_officer', 'system_admin', 'finance_admin'], id: 'portfolio' },
  { to: '/admin/collections', icon: AlertTriangle, label: 'Collections', roles: ['loan_officer', 'system_admin', 'finance_admin'], id: 'collections' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports', roles: ['system_admin', 'finance_admin'], id: 'reports' },
  { to: '/admin/users', icon: Users, label: 'User Management', roles: ['system_admin'], id: 'users' },
];

const AdminLayout = () => {
  const { logout, currentUser, role } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Only fetch pending count if role is LOAN_OFFICER or SYSTEM_ADMIN
    if (['loan_officer', 'system_admin', 'finance_admin'].includes(role)) {
      apiClient.get('/api/v1/admin/applications/pending')
        .then(res => setPendingCount(res.data?.length || 0))
        .catch(() => setPendingCount(0));
    }
  }, [role]);

  const visibleLinks = adminNavLinks.filter(l => l.roles.includes(role));

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">EduBridge</h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-medium">Internal Portal</p>
        </div>

        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {currentUser?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentUser?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 capitalize">{role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {visibleLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <link.icon className="w-4 h-4" />
                {link.label}
              </div>
              {link.id === 'applications' && pendingCount > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 px-3 py-2 w-full rounded-lg hover:bg-slate-800 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-4 shadow-sm flex items-center justify-between z-10">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Internal Admin System</p>
          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-100">{role?.replace('_', ' ')?.toUpperCase()}</span>
        </header>
        <div className="flex-1 overflow-auto bg-gray-50 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

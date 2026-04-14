import React, { useState } from 'react';
import useSWR from 'swr';
import { UserPlus, MoreVertical, Edit2, KeyRound, Ban, CheckCircle2 } from 'lucide-react';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import SuccessToast from '../../shared/components/SuccessToast';

const fetcher = url => apiClient.get(url).then(res => {
  const d = res?.data ?? res;
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.applications)) return d.applications;
    if (Array.isArray(d.users)) return d.users;
    if (Array.isArray(d.collections)) return d.collections;
    return d; // For object responses like portfolio
  }
  return [];
});

const ROLES = [
  { value: 'loan_officer', label: 'Loan Officer' },
  { value: 'finance_admin', label: 'Finance Admin' },
  { value: 'system_admin', label: 'System Admin' }
];

const UserManagement = () => {
  
  const [toast, setToast] = useState(null);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, type: null, user: null });
  const [newRole, setNewRole] = useState('');
  
  // New User Form
  const [newUser, setNewUser] = useState({ name: '', phone: '', role: 'loan_officer' });
  const [isActing, setIsActing] = useState(false);

  const [actionError, setActionError] = useState(null);
  const { data: usersData, error, isLoading, mutate } = useSWR('/api/v1/admin/users', fetcher);
  const users = usersData || [];
  const loading = isLoading && !usersData;

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsActing(true);
    try {
      await apiClient.post('/api/v1/admin/users', newUser);
      setToast(`Created user account for ${newUser.name}. PIN sent via SMS.`);
      setAddModalOpen(false);
      setNewUser({ name: '', phone: '', role: 'loan_officer' });
      mutate();
    } catch (err) {
      setActionError(err.message || 'Failed to create user.');
    } finally {
      setIsActing(false);
    }
  };

  const handleUserAction = async () => {
    if (!actionModal.user) return;
    setIsActing(true);
    const { type, user } = actionModal;
    
    try {
      if (type === 'role') {
        await apiClient.put(`/api/v1/admin/users/${user.id}/role`, { role: newRole });
        setToast(`${user.name}'s role updated to ${newRole.replace('_', ' ')}.`);
      } else if (type === 'toggle_status') {
        const newStatus = user.status === 'active' ? 'locked' : 'active';
        await apiClient.put(`/api/v1/admin/users/${user.id}/status`, { status: newStatus });
        setToast(`${user.name}'s account has been ${newStatus}.`);
      } else if (type === 'reset_pin') {
        await apiClient.post(`/api/v1/admin/users/${user.id}/reset-pin`);
        setToast(`New PIN generated and sent to ${user.phone}.`);
      }
      mutate();
      setActionModal({ open: false, type: null, user: null });
    } catch (err) {
      setActionError(err.message || `Failed to perform action.`);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <SuccessToast message={toast} visible={!!toast} onClose={() => setToast(null)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-500 mt-1">Manage RBAC, provision accounts, and reset credentials for internal staff</p>
        </div>
        <button 
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-5 h-5" /> Add Internal User
        </button>
      </div>

      {(error || actionError) && <ErrorBanner message={actionError || 'Failed to load users.'} onRetry={() => mutate()} />}

      {/* Users Table */}
      <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-visible">
        <div className="overflow-x-auto min-h-96">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role & Access</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Controls</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading && users.length === 0 ? (
                <tr><td colSpan="5" className="p-8"><LoadingSpinner /></td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-bold text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 uppercase tracking-wide">
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}</div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setNewRole(user.role); setActionModal({ open: true, type: 'role', user }); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Change Role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setActionModal({ open: true, type: 'reset_pin', user })}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Reset PIN"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setActionModal({ open: true, type: 'toggle_status', user })}
                        className={`p-1.5 rounded ${user.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-red-500 hover:text-green-600 hover:bg-green-50'}`} 
                        title={user.status === 'active' ? 'Deactivate' : 'Reactivate'}
                      >
                        {user.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Add Internal User</h3>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input required type="text" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="+2567..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role / Access Level</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              
              <div className="pt-4 flex gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setAddModalOpen(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isActing} className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                  {isActing ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal (Role / Status / PIN) */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {actionModal.type === 'role' ? 'Change Role' : actionModal.type === 'toggle_status' ? 'Confirm Status Change' : 'Reset User PIN'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {actionModal.type === 'role' ? `Update permissions for ${actionModal.user?.name}.` : 
               actionModal.type === 'toggle_status' ? `Are you sure you want to ${actionModal.user?.status === 'active' ? 'lock' : 'reactivate'} ${actionModal.user?.name}'s account?` :
               `Generate a new high-entropy PIN and send it to ${actionModal.user?.phone}?`
              }
            </p>

            {actionModal.type === 'role' && (
              <div className="mb-6 text-left">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase">Select New Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button disabled={isActing} onClick={() => setActionModal({open: false})} className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button disabled={isActing} onClick={handleUserAction} className={`flex-1 py-2 rounded-lg text-sm font-bold text-white shadow-sm disabled:opacity-50 ${
                actionModal.type === 'toggle_status' && actionModal.user?.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}>
                {isActing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

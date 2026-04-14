import React, { useState } from 'react';
import useSWR from 'swr';
import apiClient from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import EmptyState from '../../shared/components/EmptyState';
import SuccessToast from '../../shared/components/SuccessToast';

const Confirmations = () => {
  const { currentUser } = useAuth();
  const schoolId = currentUser?.school_id || currentUser?.id;
  const fetcher = url => apiClient.get(url).then(res => res?.data?.applications || res?.data?.enrollments || res?.data || res);
  const { data: pendingData, error, isLoading, mutate: fetchPending } = useSWR(schoolId ? `/api/v1/schools/${schoolId}/pending-enrollments` : null, fetcher);
  const pending = Array.isArray(pendingData) ? pendingData : [];
  const loading = isLoading && !pendingData;
  const errorObj = error?.message || null;
  
  // Modals state
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null, application: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flagReason, setFlagReason] = useState('not_enrolled');
  const [flagNotes, setFlagNotes] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const openModal = (type, app) => setActionModal({ isOpen: true, type, application: app });
  const closeModal = () => {
    setActionModal({ isOpen: false, type: null, application: null });
    setFlagReason('not_enrolled');
    setFlagNotes('');
  };

  const handleAction = async () => {
    if (!actionModal.application) return;
    setIsSubmitting(true);
    const isConfirm = actionModal.type === 'confirm';
    const appId = actionModal.application.id || actionModal.application.application_id;
    
    try {
      if (isConfirm) {
        await apiClient.put(`/api/v1/schools/${schoolId}/confirm`, {
          application_id: appId,
          status: 'confirmed'
        });
      } else {
        await apiClient.put(`/api/v1/schools/${schoolId}/flag`, {
          application_id: appId,
          reason_code: flagReason,
          notes: flagNotes
        });
      }
      setToastMsg(`Application successfully ${isConfirm ? 'confirmed' : 'flagged'}`);
      fetchPending();
      closeModal();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check if pending > 24 hours
  const isOverdue = (dateString) => {
    const hoursPending = (new Date() - new Date(dateString)) / (1000 * 60 * 60);
    return hoursPending > 24;
  };

  if (loading) return <LoadingSpinner variant="full" />;
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {toastMsg && <SuccessToast message={toastMsg} visible={!!toastMsg} onClose={() => setToastMsg(null)} />}
      
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Pending Confirmations</h2>
          <p className="text-sm text-gray-500 mt-1">Review and confirm student enrollment for pending loan applications.</p>
        </div>
      </div>

      {errorObj && <ErrorBanner message={errorObj} onRetry={fetchPending} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {pending.length === 0 ? (
          <EmptyState title="All Caught Up" message="There are no pending applications requiring confirmation at this time." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Pending</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pending.map((app) => {
                  const overdue = isOverdue(app.created_at);
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{app.parent_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.student_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.class_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">UGX {(app.fee_amount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-1 rounded-full font-medium text-xs ${overdue ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                           {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button 
                          onClick={() => openModal('confirm', app)}
                          className="text-emerald-600 hover:text-emerald-900 transition-colors bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => openModal('flag', app)}
                          className="text-red-600 hover:text-red-900 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md"
                        >
                          Flag Issue
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onClick={!isSubmitting ? closeModal : undefined}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                  {actionModal.type === 'confirm' ? 'Confirm Enrollment' : 'Flag Issue with Application'}
                </h3>
                
                <div className="mt-4">
                  {actionModal.type === 'confirm' ? (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <p className="text-sm text-gray-600">
                        Confirm that <strong className="text-gray-900">{actionModal.application.student_name}</strong> is enrolled in <strong className="text-gray-900">{actionModal.application.class_name}</strong>, their fee is <strong className="text-emerald-600 font-bold">UGX {(actionModal.application.fee_amount || 0).toLocaleString()}</strong>, and they are in good standing.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-medium text-gray-700">Reason</label>
                         <select 
                           value={flagReason}
                           onChange={(e) => setFlagReason(e.target.value)}
                           className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md border"
                         >
                           <option value="not_enrolled">Student not enrolled</option>
                           <option value="fee_mismatch">Fee amount incorrect</option>
                           <option value="bad_standing">Student not in good standing</option>
                           <option value="other">Other issue</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                         <textarea
                           value={flagNotes}
                           onChange={(e) => setFlagNotes(e.target.value)}
                           rows={3}
                           className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                           placeholder="Provide more context..."
                         />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleAction}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    actionModal.type === 'confirm' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Processing...' : (actionModal.type === 'confirm' ? 'Yes, Confirm' : 'Submit Flag')}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={closeModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Confirmations;

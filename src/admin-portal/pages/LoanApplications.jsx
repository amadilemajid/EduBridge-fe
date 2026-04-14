import React, { useState } from 'react';
import useSWR from 'swr';
import { Check, X, Clock, AlertTriangle } from 'lucide-react';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import EmptyState from '../../shared/components/EmptyState';
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

const REJECTION_REASONS = [
  { code: 'INSUFFICIENT_SAVINGS', label: 'Insufficient savings' },
  { code: 'KYC_DOCS_UNREADABLE', label: 'KYC docs unreadable' },
  { code: 'HIGH_RISK_SCORE', label: 'High risk score' },
  { code: 'SCHOOL_DISCREPANCY', label: 'School discrepancy' },
  { code: 'EXISTING_OVERDUE_LOAN', label: 'Existing overdue loan' },
  { code: 'OTHER', label: 'Other' },
];

const getRiskColor = (band) => {
  const b = (band || '').toLowerCase();
  if (b === 'high') return 'bg-red-50 text-red-700 border-red-200';
  if (b === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (b === 'low') return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

const getRelativeTime = (dateString) => {
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const elapsed = new Date() - new Date(dateString);

  if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + ' min ago';
  if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + ' hr ago';
  return Math.round(elapsed / msPerDay) + ' days ago';
};

const LoanApplications = () => {
  
  const [toast, setToast] = useState(null);

  const [modal, setModal] = useState({ open: false, type: null, app: null });
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isActing, setIsActing] = useState(false);

  const { data: applicationsData, error, isLoading, mutate: fetchQueue } = useSWR('/api/v1/admin/loan-queue', fetcher);
//   const [actionError, setActionError] = useState(null);
  const applications = applicationsData || [];
  const loading = isLoading && !applicationsData;

  const handleAction = async () => {
    if (!modal.app) return;
    setIsActing(true);

    const isApprove = modal.type === 'approve';
    const appId = modal.app.id || modal.app.application_id;
    if (!appId || (typeof appId === 'string' && appId.length < 10)) {
       alert("Invalid Application ID. Please refresh the queue.");
       setIsActing(false);
       return;
    }
    const endpoint = `/api/v1/admin/applications/${appId}/${isApprove ? 'approve' : 'reject'}`;
    const payload = isApprove ? {} : { reason_code: rejectReason, reason: rejectNotes || rejectReason };

    try {
      await apiClient.post(endpoint, payload);
      const name = modal.app.full_name || modal.app.applicant_name || modal.app.parent_name || 'Applicant';
      setToast(`Application for ${name} successfully ${isApprove ? 'approved ✓' : 'rejected'}.`);
      fetchQueue();
      closeModal();
    } catch (err) {
      alert(err.message || `Failed to ${modal.type} application.`);
      closeModal();
    } finally {
      setIsActing(false);
    }
  };

  const closeModal = () => {
    setModal({ open: false, type: null, app: null });
    setRejectReason(REJECTION_REASONS[0].code);
    setRejectNotes('');
  };

  if (loading) return <LoadingSpinner variant="full" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SuccessToast message={toast} visible={!!toast} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Application Queue</h2>
          <p className="text-gray-500 mt-1">{applications.length} loan applications pending final review</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchQueue} />}

      {applications.length === 0 && !error ? (
        <EmptyState title="Queue Empty" message="Great job! There are no pending applications awaiting review." icon={Check} />
      ) : (
        <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loan Type & Amount</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">School / Merchant</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Band & KYC</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Time</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Decision</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app, idx) => {
                  // Normalize field names — backend returns full_name, amount_requested, school_name
                  const applicantName = app.full_name || app.applicant_name || app.parent_name || `Applicant #${app.application_id || app.id || idx}`;
                  const schoolName    = app.school_name || 'N/A';
                  const amount        = app.amount_requested || app.loan_amount || app.requested_amount || 0;
                  const riskBand      = app.risk_band || 'Medium';
                  const loanType      = app.loan_type === 'supplies_loan' || app.loan_type === 'supplies' ? 'Supplies Loan' : 'Fee Loan';
                  const isHighRisk    = riskBand.toLowerCase() === 'high';
                  const appId         = app.application_id || app.id;

                  return (
                    <tr key={appId || idx} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                            {applicantName.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{applicantName}</div>
                            <div className="text-xs text-gray-500">{app.phone || app.phone_number || 'No phone on record'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">UGX {Number(amount).toLocaleString()}</div>
                        <div className="text-xs text-gray-500 uppercase font-medium tracking-wide mt-0.5">{loanType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{schoolName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getRiskColor(riskBand)}`}>
                            {isHighRisk && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {riskBand} Risk
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${app.kyc_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {app.kyc_status === 'verified' ? 'KYC Verified' : 'KYC Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium flex items-center gap-1.5 mt-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {getRelativeTime(app.applied_at || app.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setModal({ open: true, type: 'reject', app })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            title="Reject Application"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                          <button
                            onClick={() => setModal({ open: true, type: 'approve', app })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                            title="Approve Application"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-6 border-b ${modal.type === 'approve' ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
              <h3 className={`text-xl font-bold ${modal.type === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                {modal.type === 'approve' ? 'Approve Loan Application' : 'Reject Loan Application'}
              </h3>
            </div>
            
            <div className="p-6">
              {modal.type === 'approve' ? (
                <div className="space-y-4">
                  <p className="text-gray-700 text-base leading-relaxed">
                    Approve <strong className="text-gray-900">UGX {(modal.app?.loan_amount || modal.app?.requested_amount || 0).toLocaleString()}</strong> {modal.app?.loan_type === 'supplies' ? 'supplies' : 'fee'} loan for <strong className="text-gray-900">{modal.app?.applicant_name || modal.app?.parent_name}</strong> at <strong className="text-gray-900">{modal.app?.school_name || 'the institution'}</strong>?
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 grid grid-cols-2 gap-4 text-sm mt-4">
                    <div><span className="text-gray-500">Risk Score:</span> <strong className="ml-1 text-gray-900">{modal.app?.risk_band || 'Medium'}</strong></div>
                    <div><span className="text-gray-500">Repayment:</span> <strong className="ml-1 text-gray-900">{modal.app?.repayment_weeks || 12} weeks</strong></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Primary Reason <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none font-medium text-gray-900 shadow-sm"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      >
                        {REJECTION_REASONS.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Additional Notes (Optional)</label>
                    <textarea 
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
                      placeholder="Add any internal remarks here..."
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={closeModal}
                disabled={isActing}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAction}
                disabled={isActing}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold text-white shadow-sm transition-colors ${
                  modal.type === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } ${isActing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isActing ? 'Processing...' : modal.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanApplications;

import React, { useEffect, useState } from 'react';
import apiClient from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import SuccessToast from '../../shared/components/SuccessToast';
import EmptyState from '../../shared/components/EmptyState';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// US-P05, US-P06, US-P07, US-P08 — Fee Loan flow
const Loans = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('active'); // active | apply | history
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [activeLoan, setActiveLoan] = useState(null);
  const [history, setHistory] = useState([]);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [repaymentWeeks, setRepaymentWeeks] = useState('4');
  const [pin, setPin] = useState('');
  const [applyError, setApplyError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eligRes, loanRes, histRes] = await Promise.allSettled([
          apiClient.get('/api/v1/loans/eligibility'),
          apiClient.get('/api/v1/loans/active'),
          apiClient.get('/api/v1/loans/history'),
        ]);
        if (eligRes.status === 'fulfilled') setEligibility(eligRes.value?.data);
        if (loanRes.status === 'fulfilled') setActiveLoan(loanRes.value?.data);
        if (histRes.status === 'fulfilled') setHistory(histRes.value?.data || []);
      } catch {
        setError('Could not load loan data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyError(null);
    setIsApplying(true);
    try {
      // POST /api/v1/loans/apply — confirmation via PIN as per US-P05 AC
      await apiClient.post('/api/v1/loans/apply', {
        student_id: currentUser?.student_id,
        repayment_weeks: Number(repaymentWeeks),
        pin,
      });
      setApplySuccess(true);
      setToast('Loan application submitted! You will be notified once reviewed.');
    } catch (err) {
      setApplyError(err.message || 'Application failed. Please check your eligibility.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRepay = async (loanId) => {
    try {
      // POST /api/v1/loans/:id/repay — pushes MoMo prompt (US-P07)
      await apiClient.post(`/api/v1/loans/${loanId}/repay`);
      setToast('A MoMo payment prompt has been sent to your phone. Complete payment there.');
    } catch (err) {
      setError(err.message || 'Repayment failed.');
    }
  };

  if (loading) return <LoadingSpinner variant="full" />;

  const STATUS_STYLE = { active: 'bg-green-100 text-green-800', overdue: 'bg-red-100 text-red-800', paid: 'bg-gray-100 text-gray-600', approved: 'bg-blue-100 text-blue-800' };

  return (
    <div className="space-y-5">
      <SuccessToast message={toast} visible={!!toast} onClose={() => setToast(null)} />
      {error && <ErrorBanner message={error} />}

      <h2 className="text-xl font-extrabold text-gray-900">School Fee Loan</h2>

      {/* Tab nav */}
      <div className="flex border-b border-gray-200">
        {[['active', 'My Loan'], ['apply', 'Apply'], ['history', 'History']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 ${tab === key ? 'border-sky-500 text-sky-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        activeLoan ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Active Loan</h3>
              <span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${STATUS_STYLE[activeLoan.status] || 'bg-gray-100 text-gray-600'}`}>{activeLoan.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Loan Amount', `UGX ${(activeLoan.principal || 0).toLocaleString()}`],
                ['Outstanding', `UGX ${(activeLoan.remaining_balance || 0).toLocaleString()}`],
                ['Interest Rate', activeLoan.interest_rate ? `${activeLoan.interest_rate}% flat` : '—'],
                ['Disbursed To', activeLoan.school_name || '—'],
                ['Next Due', activeLoan.next_due_date ? new Date(activeLoan.next_due_date).toLocaleDateString() : '—'],
                ['Term', activeLoan.term || '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-gray-500 text-xs">{l}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {activeLoan.status === 'overdue' && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Your payment is overdue. A 3-day grace period applies before late fees.
              </div>
            )}

            <button onClick={() => handleRepay(activeLoan.id)}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl transition-colors">
              Repay via Mobile Money
            </button>
          </div>
        ) : (
          <EmptyState title="No Active Loan" message="You have no current fee loan. Apply at the start of term." actionLabel="Apply Now" onAction={() => setTab('apply')} />
        )
      )}

      {tab === 'apply' && (
        applySuccess ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-black text-gray-900 text-xl mb-2">Application Submitted!</h3>
            <p className="text-gray-500 text-sm">You will receive an SMS once your application is reviewed. Returning borrowers with a clean record are auto-approved within 15 minutes.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-5">
            {eligibility ? (
              <>
                <div className="bg-sky-50 rounded-xl p-4 text-sm space-y-2 border border-sky-100">
                  <p className="font-bold text-gray-900">Your Eligibility</p>
                  <div className="flex justify-between"><span className="text-gray-500">Credit Score</span><span className="font-semibold">{eligibility.score ?? '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Max Loan Amount</span><span className="font-bold text-sky-700">UGX {(eligibility.max_amount || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Auto-Approval</span><span className={`font-semibold ${eligibility.auto_approve ? 'text-green-700' : 'text-amber-600'}`}>{eligibility.auto_approve ? 'Eligible' : 'Manual review'}</span></div>
                </div>

                {applyError && <ErrorBanner message={applyError} />}

                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Repayment Schedule</label>
                    <select value={repaymentWeeks} onChange={e => setRepaymentWeeks(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-sky-400">
                      <option value="4">4 weeks</option>
                      <option value="6">6 weeks</option>
                      <option value="8">8 weeks</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Preview: UGX {Math.round((eligibility.max_amount || 0) / Number(repaymentWeeks)).toLocaleString()} per week</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm with your PIN</label>
                    <input type="password" maxLength={4} required value={pin} onChange={e => setPin(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:ring-2 focus:ring-sky-400 tracking-widest"
                      placeholder="••••" />
                    <p className="text-xs text-gray-400 mt-1">Your PIN confirms this application. Agreement viewable in English and Luganda.</p>
                  </div>
                  <button type="submit" disabled={isApplying}
                    className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-colors ${isApplying ? 'bg-sky-300 cursor-wait' : 'bg-sky-600 hover:bg-sky-700'}`}>
                    {isApplying ? 'Applying...' : 'Submit Application'}
                  </button>
                </form>
              </>
            ) : (
              <EmptyState message="Eligibility data not available. Make sure you have registered a student and school." />
            )}
          </div>
        )
      )}

      {tab === 'history' && (
        history.length === 0 ? (
          <EmptyState message="No previous loans found." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {history.map((loan, idx) => (
                <div key={loan.id || idx} className="px-5 py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">UGX {(loan.principal || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{loan.term} · {new Date(loan.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${STATUS_STYLE[loan.status] || 'bg-gray-100 text-gray-600'}`}>{loan.status}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Loans;

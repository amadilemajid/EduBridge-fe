import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { 
  ChevronLeft, GraduationCap, CheckCircle2, 
  Wallet, Banknote, Calendar, Lock, Info 
} from 'lucide-react';

const FeeLoanApply = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data State
  const [eligibility, setEligibility] = useState(null);
  
  // Form State
  const [scheduleWeeks, setScheduleWeeks] = useState(4); // 4, 6, 8
  const [agreed, setAgreed] = useState(false);
  const [pin, setPin] = useState('');
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'approved' or 'pending'

  useEffect(() => {
    const fetchEligibility = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/v1/loans/eligibility').catch(() => ({
          // Mock data
          data: {
            child_name: 'Sarah Nabulya',
            school: 'Greenhill Academy',
            grade: 'P4',
            fee_amount: 850000,
            wallet_balance: 150000,
            maximum_eligible_amount: 700000
          }
        }));
        setEligibility(response.data);
      // eslint-disable-next-line no-unused-vars
      } catch (_) {
        setError("Could not retrieve loan eligibility profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchEligibility();
  }, []);

  const netLoanAmount = eligibility ? Math.max(0, eligibility.fee_amount - eligibility.wallet_balance) : 0;
  
  // Mock calculation: 5% flat fee for simplicity of demonstration, or true APR amortization (we go with 5% flat for now as specified by user: "5% per month on amount borrowed")
  // So a 4 week loan is ~1 month -> 5% interest total.
  // 8 week loan is ~2 months -> 10% interest total.
  const months = scheduleWeeks / 4;
  const interestRateTotal = 0.05 * months;
  const totalRepayAmount = netLoanAmount * (1 + interestRateTotal);
  const installmentAmount = totalRepayAmount / (scheduleWeeks / 2); // Bi-weekly installments (assuming 1 per 2 weeks to make 2, 3, or 4 payments)
  const numberOfInstallments = scheduleWeeks / 2;

  const getScheduleDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= numberOfInstallments; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + (i * 14)); // Every 2 weeks
      dates.push(d);
    }
    return dates;
  };

  const submitApplication = async () => {
    if (pin.length !== 4) {
      setError("Please put your 4-digit PIN.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    
    try {
      // POST /api/v1/loans/apply
      const result = await apiClient.post('/api/v1/loans/apply', {
        child_id: 'mock-id-123',
        amount: netLoanAmount,
        weeks: scheduleWeeks,
        pin: pin
      }).catch(async () => {
        // Mock successful submission
        await new Promise(r => setTimeout(r, 1500));
        return { data: { status: 'approved' } }; // Can be 'approved' or 'pending'
      });
      
      setSubmitStatus(result.data.status);
      setSubmitSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to submit loan application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner variant="full" />;

  // -------------------------
  // Success View
  // -------------------------
  if (submitSuccess) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col font-sans max-w-md mx-auto relative">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm ${submitStatus === 'approved' ? 'bg-green-100' : 'bg-amber-100'}`">
            {submitStatus === 'approved' ? (
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            ) : (
              <Calendar className="w-12 h-12 text-amber-600" />
            )}
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-3">
            {submitStatus === 'approved' ? 'Loan Approved!' : 'Application Under Review'}
          </h2>
          
          <p className="text-gray-600 text-[15px] leading-relaxed mb-8">
            {submitStatus === 'approved' 
              ? `Your loan of UGX ${netLoanAmount.toLocaleString()} has been approved. The funds have been disbursed directly to ${eligibility.school}. Your child can now attend classes.`
              : 'Your application is under review. We will verify the details with the school and notify you within 24 hours.'}
          </p>
          
          <button
            onClick={() => navigate('/parent/dashboard')}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans max-w-md mx-auto relative pb-safe">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 ml-2">Apply for Fee Loan</h1>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {error && <ErrorBanner message={error} />}

        {/* 1. Student Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {eligibility.child_name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900">{eligibility.child_name}</p>
              <p className="text-xs text-slate-500">{eligibility.school} • {eligibility.grade}</p>
            </div>
          </div>
        </div>

        {/* 2. Financial Breakdown */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Term Fee Amount</span>
              <span className="font-medium">UGX {eligibility.fee_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-400 flex items-center gap-1.5"><Wallet className="w-4 h-4" /> Savings Offset</span>
              <span className="font-medium text-emerald-400">- UGX {eligibility.wallet_balance.toLocaleString()}</span>
            </div>
            <div className="border-t border-slate-700 pt-4 flex justify-between items-end">
              <span className="text-sm font-bold text-slate-300">Net Loan Required</span>
              <span className="text-2xl font-black text-white">UGX {netLoanAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 3. Schedule Selection */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-3">Select Repayment Term</h3>
          <div className="flex gap-3 block">
            {[
              { w: 4, l: '4 Weeks', i: '2 installments' },
              { w: 6, l: '6 Weeks', i: '3 installments' },
              { w: 8, l: '8 Weeks', i: '4 installments' }
            ].map(opt => (
              <button 
                key={opt.w}
                onClick={() => setScheduleWeeks(opt.w)}
                className={`flex-1 p-3 rounded-xl border transition-colors ${scheduleWeeks === opt.w ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className={`font-bold text-sm mb-0.5 ${scheduleWeeks === opt.w ? 'text-sky-700' : 'text-slate-700'}`}>{opt.l}</div>
                <div className="text-[10px] text-slate-500 font-medium">{opt.i}</div>
              </button>
            ))}
          </div>

          {/* Schedule Preview */}
          <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Installment Preview</h4>
            <div className="space-y-3">
              {getScheduleDates().map((date, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    <span className="text-slate-600 font-medium">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <span className="font-bold text-slate-900">UGX {Math.round(installmentAmount).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between text-sm">
              <span className="text-slate-600 font-semibold">Total Repayment</span>
              <span className="font-bold text-slate-900">UGX {Math.round(totalRepayAmount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 4. APR Disclosure */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            <span className="font-bold">APR Disclosure:</span> Interest rate: 5% per month (60% APR) on amount borrowed. Total interest for this term is UGX {(totalRepayAmount - netLoanAmount).toLocaleString()}.
          </p>
        </div>

        {/* 5. Loan Agreement */}
        <div>
          <h3 className="font-bold text-slate-900 mb-2 px-1 text-sm">Loan Agreement</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-4 h-32 overflow-y-auto text-xs text-slate-600 leading-relaxed mb-3">
            <p className="font-bold text-slate-800 mb-1">TERMS AND CONDITIONS</p>
            <p className="mb-2">1. The Borrower agrees to repay the Principal sum plus accrued interest according to the schedule above.</p>
            <p className="mb-2">2. Failure to meet an installment deadline will result in a 3-day grace period, after which a 5% late fee penalty is applied to the outstanding installment balance.</p>
            <p className="mb-2">3. The Loan Amount will be disbursed directly to the School identified above without passing through the Borrower's mobile money account.</p>
            <p>4. By entering your PIN, you digitally sign this contract.</p>
          </div>
          <label className="flex items-start gap-3 p-1">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500" 
            />
            <span className="text-sm font-medium text-slate-700">I have read and agree to the loan agreement and the Truth in Lending disclosures.</span>
          </label>
        </div>

        {/* 6. PIN & Submit */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mt-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm with 4-Digit PIN</label>
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="password" 
              inputMode="numeric" 
              maxLength={4} 
              value={pin} 
              onChange={e => setPin(e.target.value)}
              className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-black tracking-[0.3em] focus:ring-2 focus:ring-sky-500 focus:border-sky-500" 
              placeholder="••••" 
            />
          </div>
          
          <button 
            disabled={!agreed || pin.length !== 4 || isSubmitting}
            onClick={submitApplication}
            className="w-full py-4 bg-sky-600 text-white font-bold rounded-xl shadow-md disabled:bg-slate-300 disabled:text-slate-500 transition-colors flex justify-center"
          >
            {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sign & Submit Loan"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FeeLoanApply;

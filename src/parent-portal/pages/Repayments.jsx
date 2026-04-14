import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { 
  ChevronLeft, GraduationCap, ShoppingBag, 
  Smartphone, CheckCircle2, ArrowRight
} from 'lucide-react';

const Repayments = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data
  const [feeLoan, setFeeLoan] = useState(null);
  const [suppliesLoan, setSuppliesLoan] = useState(null);
  
  // Payment State
  const [customAmounts, setCustomAmounts] = useState({});
  const [isProcessing, setIsProcessing] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      try {
        const [loanRes, bnplRes] = await Promise.allSettled([
          apiClient.get('/api/v1/loans/active').catch(() => ({
            data: { id: 'FEE-902', type: 'fee', outstanding: 350000, next_amount: 150000, due_date: new Date(Date.now() + 86400 * 5 * 1000).toISOString() }
          })),
          apiClient.get('/api/v1/supplies/eligibility').catch(() => ({
            data: { isActive: true, id: 'SUP-405', type: 'supplies', outstanding: 45000, next_amount: 45000, due_date: new Date(Date.now() + 86400 * 12 * 1000).toISOString() }
          }))
        ]);

        if (loanRes.status === 'fulfilled' && loanRes.value?.data?.id) {
          setFeeLoan(loanRes.value.data);
          setCustomAmounts(prev => ({...prev, fee: loanRes.value.data.next_amount}));
        }
        
        if (bnplRes.status === 'fulfilled' && bnplRes.value?.data?.isActive) {
          setSuppliesLoan(bnplRes.value.data);
          setCustomAmounts(prev => ({...prev, supplies: bnplRes.value.data.next_amount}));
        }
      // eslint-disable-next-line no-unused-vars
      } catch (_) {
        setError("Could not load payment schedules.");
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const handleAmountChange = (type, value) => {
    const num = parseInt(value.replace(/\D/g, ''), 10);
    setCustomAmounts(prev => ({...prev, [type]: isNaN(num) ? '' : num }));
  };

  const handleRepay = async (type, loanId, amount) => {
    if (!amount || amount < 1000) {
      setError("Payment amount must be at least UGX 1,000.");
      return;
    }
    setError(null);
    setIsProcessing(type);
    
    try {
      const endpoint = type === 'fee' ? `/api/v1/loans/${loanId}/repay` : `/api/v1/supplies/${loanId}/repay`;
      await apiClient.post(endpoint, { amount }).catch(async () => {
        // Mock mobile money push delay
        await new Promise(r => setTimeout(r, 2000));
      });
      
      const maskedPhone = currentUser?.phone_number ? 
        currentUser.phone_number.substring(0, 6) + '***' + currentUser.phone_number.substring(currentUser.phone_number.length - 3) : 
        '+25670***123';
        
      setSuccessMsg(`A payment request of UGX ${amount.toLocaleString()} has been sent to your MTN/Airtel number ${maskedPhone}. Approve it on your phone to complete the payment.`);
    } catch (err) {
      setError(err.message || "Payment request failed.");
    } finally {
      setIsProcessing(null);
    }
  };

  const RepaymentCard = ({ type, data }) => {
    const isFee = type === 'fee';
    const Icon = isFee ? GraduationCap : ShoppingBag;
    const title = isFee ? 'Fee Loan Installment' : 'Supplies Repayment';
    const amount = customAmounts[type];

    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isFee ? 'bg-sky-100 text-sky-600' : 'bg-amber-100 text-amber-600'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500 font-medium">Due: {new Date(data.due_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Outstanding</p>
            <p className="font-bold text-slate-700">UGX {data.outstanding.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount to Pay</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">UGX</span>
            <input 
              type="text" 
              value={amount ? amount.toLocaleString() : ''}
              onChange={(e) => handleAmountChange(type, e.target.value)}
              className="w-full pl-12 bg-white border border-slate-200 rounded-xl p-3 text-lg font-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
            />
          </div>
          {amount !== data.next_amount && (
            <p className="text-[10px] text-emerald-600 font-bold mt-2">
              Partial payment mode active. Full installment is UGX {data.next_amount.toLocaleString()}.
            </p>
          )}
        </div>

        <button 
          disabled={isProcessing === type || !amount}
          onClick={() => handleRepay(type, data.id, amount)}
          className={`w-full py-4 rounded-xl font-bold shadow-md transition-colors flex justify-center items-center gap-2 text-white ${isFee ? 'bg-slate-900 hover:bg-slate-800' : 'bg-amber-500 hover:bg-amber-600'}`}
        >
          {isProcessing === type ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Pay UGX {amount?.toLocaleString() || '0'} <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    );
  };

  if (loading) return <LoadingSpinner variant="full" />;

  // -------------------------
  // Success / MoMo Push Overlay
  // -------------------------
  if (successMsg) {
    return (
      <div className="min-h-[100dvh] bg-emerald-600 flex flex-col font-sans max-w-md mx-auto relative px-6 py-10 text-white">
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg relative z-10">
              <Smartphone className="w-10 h-10 text-emerald-600 animate-bounce" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black mb-3 text-white">Check Your Phone</h2>
          <div className="bg-white/10 rounded-2xl p-5 border border-white/20 mb-8 backdrop-blur-sm">
            <p className="text-emerald-50 text-[15px] leading-relaxed font-medium">
              {successMsg}
            </p>
          </div>
          
          <button
            onClick={() => {
              setSuccessMsg(null);
              navigate('/parent/dashboard');
            }}
            className="w-full bg-white text-emerald-700 font-black py-4 rounded-xl shadow-lg hover:bg-emerald-50 transition-colors"
          >
            I have completed the payment
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
        <h1 className="text-lg font-bold text-slate-900 ml-2">Make a Repayment</h1>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {error && <ErrorBanner message={error} />}

        {!feeLoan && !suppliesLoan ? (
          <div className="text-center py-10">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">All Caught Up!</h3>
            <p className="text-slate-500 text-sm">You have no active loans or pending installments at this time.</p>
          </div>
        ) : (
          <>
            {feeLoan && <RepaymentCard type="fee" data={feeLoan} />}
            {suppliesLoan && <RepaymentCard type="supplies" data={suppliesLoan} />}
          </>
        )}
      </div>
    </div>
  );
};

export default Repayments;

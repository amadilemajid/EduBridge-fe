import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { 
  ChevronLeft, Timer, CheckCircle2, ShieldAlert, ShoppingBag, Store
} from 'lucide-react';

const SuppliesOTP = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [balance, setBalance] = useState(0);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  
  // Polling State
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let initialized = false;

    const initiateTransaction = async () => {
      setLoading(true);
      try {
        // Mock API load
        const response = await apiClient.post('/api/v1/supplies/transaction/initiate').catch(() => ({
          data: {
            otp: Math.floor(100000 + Math.random() * 900000).toString(),
            remaining_credit: 155000,
            expires_in: 600
          }
        }));
        
        setOtp(response.data.otp);
        setBalance(response.data.remaining_credit);
        setCountdown(response.data.expires_in);
      // eslint-disable-next-line no-unused-vars
      } catch (_) {
        setError("Could not generate a secure transaction code.");
      } finally {
        setLoading(false);
      }
    };
    
    if (!initialized) {
      initiateTransaction();
      initialized = true;
    }
  }, []);

  // Timer Countdown
  useEffect(() => {
    let timer;
    if (countdown > 0 && !transactionComplete) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, transactionComplete]);

  // Polling Simulator for Confirmation
  useEffect(() => {
    let pollInterval;
    
    if (otp && !transactionComplete) {
      // Typically we'd actually poll `apiClient.get('/api/v1/supplies/transactions?status=pending')`
      // Here, we simulate auto-approval after 15 seconds for demonstration purposes
      pollInterval = setTimeout(() => {
        setSummary({
          amount: 45000,
          shop: 'Bata Shoes Kampala',
          items: ['School Shoes - Size 4', 'Socks (Pack of 3)'],
          new_balance: balance - 45000
        });
        setTransactionComplete(true);
      }, 15000); 
    }

    return () => clearTimeout(pollInterval);
  }, [otp, transactionComplete, balance]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading && !otp) return <LoadingSpinner variant="full" />;

  // -------------------------
  // Success Receipt View
  // -------------------------
  if (transactionComplete && summary) {
    return (
      <div className="min-h-[100dvh] bg-emerald-600 flex flex-col font-sans max-w-md mx-auto relative px-6 py-10 text-white">
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6 shadow-sm border border-emerald-400">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl font-black mb-1">Approved!</h2>
          <p className="text-emerald-100 font-medium mb-10">Purchase confirmed by shop</p>

          <div className="bg-white rounded-3xl w-full p-6 text-slate-800 shadow-xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
            
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Amount Spent</p>
            <h3 className="text-4xl font-black text-slate-900 mb-6">UGX {summary.amount.toLocaleString()}</h3>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                <Store className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Merchant</p>
                  <p className="text-sm font-bold text-slate-800">{summary.shop}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Items Approved</p>
                  <ul className="text-sm font-medium text-slate-700 space-y-0.5">
                    {summary.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-500">New Credit Balance</span>
              <span className="font-black text-emerald-600">UGX {summary.new_balance.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/parent/dashboard')}
            className="w-full bg-white text-emerald-700 font-black py-4 rounded-xl shadow-lg hover:bg-emerald-50 transition-colors"
          >
            Done
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
        <h1 className="text-lg font-bold text-slate-900 ml-2">Checkout</h1>
      </div>

      <div className="flex-1 p-5 space-y-6 overflow-y-auto">
        {error && <ErrorBanner message={error} />}

        {/* Balance Top Bar */}
        <div className="bg-slate-900 rounded-2xl p-4 shadow-lg text-white flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Available Credit</p>
            <h2 className="text-xl font-black">UGX {balance.toLocaleString()}</h2>
          </div>
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* OTP Display Card */}
        <div className="bg-white border-2 border-emerald-100 rounded-3xl p-8 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-50 rounded-full blur-3xl -ml-10 -mb-10"></div>
          
          <div className="relative z-10">
            <h3 className="text-slate-500 font-bold mb-2">Show this code to the shop attendant</h3>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl py-6 my-6">
              <span className="text-5xl font-black text-slate-900 tracking-[0.2em]">{otp}</span>
            </div>

            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full font-bold">
              <Timer className="w-5 h-5 animate-pulse text-emerald-600" />
              <span>Expires in {formatTime(countdown)}</span>
            </div>
            
            <p className="text-xs text-slate-500 mt-6 leading-relaxed">
              Do not share this code over the phone. <br/>
              Only provide this code in-person to an EduBridge verified merchant.
            </p>
          </div>
        </div>

        {/* Polling Indicator */}
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin"></div>
          <div>
            <p className="font-bold text-slate-700 mb-1">Waiting for shop confirmation...</p>
            <p className="text-xs text-slate-500">Keep this screen open until the merchant approves the transaction.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliesOTP;

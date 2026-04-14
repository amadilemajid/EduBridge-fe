import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { 
  ChevronLeft, ShoppingBag, CheckCircle2, 
  BookOpen, Shirt, Pencil, Lock, Info, ExternalLink
} from 'lucide-react';

const SuppliesApply = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data State
  const [eligibility, setEligibility] = useState(null);
  
  // Form State
  const [agreed, setAgreed] = useState(false);
  const [pin, setPin] = useState('');
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchEligibility = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/v1/supplies/eligibility').catch(() => ({
          // Mock data based on TRD
          data: {
            credit_limit: 200000,
            district: 'Kampala',
            is_active: false // Meaning they haven't applied for this term yet
          }
        }));
        
        if (response.data.is_active) {
          setError("You already have an active supplies credit line for this term.");
        }
        setEligibility(response.data);
      // eslint-disable-next-line no-unused-vars
      } catch (_) {
        setError("Could not retrieve BNPL eligibility profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchEligibility();
  }, []);

  const activateCredit = async () => {
    if (pin.length !== 4) {
      setError("Please put your 4-digit PIN.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    
    try {
      // POST /api/v1/supplies/apply
      await apiClient.post('/api/v1/supplies/apply', {
        pin: pin
      }).catch(async () => {
        // Mock successful submission
        await new Promise(r => setTimeout(r, 1500));
      });
      
      setSubmitSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to activate supplies credit.");
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
      <div className="min-h-[100dvh] bg-white flex flex-col font-sans max-w-md mx-auto relative px-6 py-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-amber-600" />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-3">Credit Ready!</h2>
          
          <p className="text-gray-600 text-[15px] leading-relaxed mb-8">
            Your supplies credit of <span className="font-bold text-gray-900">UGX {(eligibility?.credit_limit || 200000).toLocaleString()}</span> is now active.
            Visit any partner shop in <span className="font-bold">{eligibility?.district || 'your district'}</span> to use it.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => navigate('/parent/supplies/shops')}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex justify-center items-center gap-2"
            >
              Find Partner Shops <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/parent/dashboard')}
              className="w-full bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
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
        <h1 className="text-lg font-bold text-slate-900 ml-2">Activate BNPL Credit</h1>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {error && <ErrorBanner message={error} />}

        {/* 1. Credit Overview */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <ShoppingBag className="w-32 h-32" />
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-amber-100 font-medium text-sm">Approved Limit</p>
            <h2 className="text-4xl font-black tracking-tight">
              <span className="text-xl font-bold text-amber-200 mr-1">UGX</span>
              {(eligibility?.credit_limit || 200000).toLocaleString()}
            </h2>
            <p className="text-amber-50 text-xs mt-2 opacity-90 leading-tight">
              Available for immediate use at registered merchants.
            </p>
          </div>
        </div>

        {/* 2. Eligible Categories */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-3 text-sm">Eligible Categories</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Shirt className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Uniforms</p>
                <p className="text-[10px] text-slate-500">Shirts, trousers, shoes</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Textbooks</p>
                <p className="text-[10px] text-slate-500">Syllabus books</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Pencil className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Stationery</p>
                <p className="text-[10px] text-slate-500">Pens, books, sets</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <ShoppingBag className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Mattresses</p>
                <p className="text-[10px] text-slate-500">Boarding supplies</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Repayment & APR */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-2 text-sm">Repayment Terms</h3>
          
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              <span className="font-bold">APR Disclosure:</span> Interest rate: 5% per month (60% APR) applied only to the <span className="font-bold bg-blue-200/50 px-1 rounded">amount you actually spend</span> at the shop.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs items-center p-2 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Schedule</span>
              <span className="font-bold text-slate-900">4 Equal Weeks</span>
            </div>
            <div className="flex justify-between text-xs items-center p-2 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Billing Cycle</span>
              <span className="font-bold text-slate-900">Starts day of purchase</span>
            </div>
          </div>
        </div>

        {/* 4. PIN & Submit */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <label className="flex items-start gap-3 p-1 mb-4">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500" 
            />
            <span className="text-sm font-medium text-slate-700">I agree to activate this credit line and accept the terms of use.</span>
          </label>

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
              className="w-full pl-10 bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-black tracking-[0.3em] focus:ring-2 focus:ring-amber-500 focus:border-amber-500" 
              placeholder="••••" 
            />
          </div>
          
          <button 
            disabled={!agreed || pin.length !== 4 || isSubmitting || eligibility?.is_active}
            onClick={activateCredit}
            className="w-full py-4 bg-amber-500 text-white font-black rounded-xl shadow-md disabled:bg-slate-300 disabled:text-slate-500 transition-colors flex justify-center items-center"
          >
            {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Activate Credit Line"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SuppliesApply;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthContext';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { Store, Unlock, Smartphone, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

const MerchantLogin = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated, isLoading: authLoading, role } = useAuth();
  const navigate = useNavigate();

  // Declarative redirect: fires whenever auth state settles.
  // This handles both: (1) user already logged in on page load,
  // (2) user just logged in and isAuthenticated flipped to true.
  useEffect(() => {
    if (!authLoading && isAuthenticated && role === 'shop_partner') {
      navigate('/merchant/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, role, navigate]);

  const normalizePhone = (p) => {
    let clean = p.trim();
    if (clean.startsWith('0')) {
      return '+256' + clean.substring(1);
    }
    if (!clean.startsWith('+')) {
      return '+' + clean;
    }
    return clean;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked || loading) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      const normalizedPhone = normalizePhone(phone);
      const result = await login({ contact_phone: normalizedPhone, pin }, true); 
      if (result && result.success === false) {
        const newCount = failedAttempts + 1;
        if (newCount >= 5) {
          setIsLocked(true);
          setErrorMsg('Account temporarily locked due to multiple failed attempts.');
        } else {
          setFailedAttempts(newCount);
          setErrorMsg(result.message || 'Invalid phone or PIN. Please try again.');
        }
      }
      // Navigation is handled declaratively via the useEffect above —
      // it fires once isAuthenticated flips to true after restoreSession().
      // eslint-disable-next-line no-unused-vars
    } catch (_) {
      setErrorMsg('Server connection failed. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 font-sans tracking-tight">
      <div className="max-w-xl w-full flex flex-col items-center">
        {/* Logo Section */}
        <div className="flex items-center gap-4 mb-12">
            <div className="bg-amber-500 p-4 rounded-3xl shadow-2xl shadow-amber-500/20 active:scale-95 transition-all">
                <Store className="w-10 h-10 text-white" />
            </div>
            <div>
                <h1 className="text-4xl font-black text-gray-900 leading-none">EduBridge</h1>
                <p className="text-amber-500 text-xs font-black uppercase mt-1.5 tracking-[0.3em]">Partner Portal</p>
            </div>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="p-12">
            {errorMsg && <div className="mb-6"><ErrorBanner message={errorMsg} /></div>}

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                    <div className="relative group">
                        <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="tel"
                            required
                            disabled={isLocked}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="block w-full bg-gray-50 border-none rounded-2xl py-5 pl-14 pr-6 text-lg font-black text-gray-900 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder-gray-200"
                            placeholder="07XXXXXXXX"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">4-Digit PIN</label>
                        <button type="button" onClick={() => navigate('/merchant/forgot-pin')} className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-all">Forgot PIN?</button>
                    </div>
                    <div className="relative group">
                        <Unlock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="password"
                            required
                            disabled={isLocked}
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="block w-full bg-gray-50 border-none rounded-2xl py-5 pl-14 pr-6 text-xl font-black text-gray-900 focus:ring-4 focus:ring-amber-500/10 transition-all tracking-[0.5em] placeholder-gray-200"
                            placeholder="••••"
                        />
                    </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked || loading}
                className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-gray-900/10 ${
                  isLocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : loading ? 'bg-slate-800 text-white cursor-wait'
                    : 'bg-slate-900 hover:bg-black text-white hover:shadow-gray-900/20 active:scale-95'
                }`}
              >
                {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                    <>
                        Access Portal
                        <ArrowRight className="w-6 h-6" />
                    </>
                )}
              </button>
            </form>

            <div className="mt-12 flex flex-col items-center gap-6">
                <div className="flex items-center gap-3 text-[10px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Secure Merchant Verification
                </div>
                <p className="text-sm font-bold text-gray-400">
                    Interested in partnering?{' '}
                    <span
                    onClick={() => navigate('/merchant/register')}
                    className="text-amber-600 hover:text-amber-700 cursor-pointer border-b-2 border-amber-500/20 hover:border-amber-500 transition-all"
                    >
                    Register your shop
                    </span>
                </p>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">© 2026 EduBridge Africa</p>
      </div>
    </div>
  );
};

export default MerchantLogin;

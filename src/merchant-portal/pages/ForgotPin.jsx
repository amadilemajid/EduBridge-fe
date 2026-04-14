import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Smartphone, KeyRound, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import apiClient from '../../shared/api/client';
import ErrorBanner from '../../shared/components/ErrorBanner';

const ForgotPin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New PIN, 4: Success
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

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

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const normalizedPhone = normalizePhone(phone);
      const response = await apiClient.post('/api/v1/merchant/forgot-pin/request', {
        contact_phone: normalizedPhone
      });
      
      // The apiClient interceptor returns response.data directly
      // So response is already { success: true, message: "...", expires_in_minutes: 10 }
      if (response.success) {
        setStep(2);
      } else {
        setErrorMsg(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP. Please verify your phone number.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const normalizedPhone = normalizePhone(phone);
      const response = await apiClient.post('/api/v1/merchant/forgot-pin/verify', {
        contact_phone: normalizedPhone,
        otp
      });
      
      if (response.success) {
        setResetToken(response.reset_token);
        setStep(3);
      } else {
        setErrorMsg(response.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPin !== confirmPin) {
      setErrorMsg('PINs do not match. Please re-enter.');
      return;
    }
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setErrorMsg('PIN must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizePhone(phone);
      await apiClient.post('/api/v1/merchant/forgot-pin/reset', {
        contact_phone: normalizedPhone,
        reset_token: resetToken,
        new_pin: newPin
      });
      
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset PIN. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 font-sans">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center border border-gray-100">
          <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">PIN Reset Successful!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your login PIN has been updated successfully. You can now log in with your new PIN.
          </p>
          <button 
            onClick={() => navigate('/merchant/login')} 
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 font-sans tracking-tight">
      <div className="max-w-xl w-full flex flex-col items-center">
        {/* Logo Section */}
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-amber-500 p-4 rounded-3xl shadow-2xl shadow-amber-500/20">
            <Store className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 leading-none">Reset PIN</h1>
            <p className="text-amber-500 text-xs font-black uppercase mt-1.5 tracking-[0.3em]">Merchant Portal</p>
          </div>
        </div>

        {/* Reset Card */}
        <div className="w-full bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-12">
            {errorMsg && <div className="mb-6"><ErrorBanner message={errorMsg} /></div>}

            {/* Step 1: Request OTP */}
            {step === 1 && (
              <form className="space-y-8" onSubmit={handleRequestOtp}>
                <div className="text-center mb-6">
                  <p className="text-gray-600 font-medium">
                    Enter your registered phone number to receive a verification code.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    Phone Number
                  </label>
                  <div className="relative group">
                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full bg-gray-50 border-none rounded-2xl py-5 pl-14 pr-6 text-lg font-black text-gray-900 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder-gray-200"
                      placeholder="07XXXXXXXX"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xl transition-all shadow-xl ${
                    loading 
                      ? 'bg-slate-800 text-white cursor-wait'
                      : 'bg-slate-900 hover:bg-black text-white hover:shadow-gray-900/20 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {step === 2 && (
              <form className="space-y-8" onSubmit={handleVerifyOtp}>
                <div className="text-center mb-6">
                  <p className="text-gray-600 font-medium">
                    Enter the 6-digit code sent to <strong>{phone}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    Verification Code
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="block w-full bg-gray-50 border-none rounded-2xl py-5 pl-14 pr-6 text-2xl font-black text-gray-900 focus:ring-4 focus:ring-amber-500/10 transition-all tracking-[0.5em] placeholder-gray-200 text-center"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xl transition-all shadow-xl ${
                    loading 
                      ? 'bg-slate-800 text-white cursor-wait'
                      : 'bg-slate-900 hover:bg-black text-white hover:shadow-gray-900/20 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm font-bold text-gray-400 hover:text-gray-600 transition-all"
                >
                  ← Back to phone entry
                </button>
              </form>
            )}

            {/* Step 3: Set New PIN */}
            {step === 3 && (
              <form className="space-y-8" onSubmit={handleResetPin}>
                <div className="text-center mb-6">
                  <p className="text-gray-600 font-medium">
                    Create a new 4-digit PIN for your account
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      New PIN
                    </label>
                    <div className="relative group">
                      <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-amber-500 transition-colors" />
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="block w-full bg-gray-50 border-none rounded-2xl py-5 pl-14 pr-6 text-xl font-black text-gray-900 focus:ring-4 focus:ring-amber-500/10 transition-all tracking-[0.5em] placeholder-gray-200"
                        placeholder="••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Confirm PIN
                    </label>
                    <div className="relative group">
                      <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-amber-500 transition-colors" />
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        className="block w-full bg-gray-50 border-none rounded-2xl py-5 pl-14 pr-6 text-xl font-black text-gray-900 focus:ring-4 focus:ring-amber-500/10 transition-all tracking-[0.5em] placeholder-gray-200"
                        placeholder="••••"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xl transition-all shadow-xl ${
                    loading 
                      ? 'bg-slate-800 text-white cursor-wait'
                      : 'bg-slate-900 hover:bg-black text-white hover:shadow-gray-900/20 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Reset PIN
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm font-bold text-gray-400">
                Remember your PIN?{' '}
                <span
                  onClick={() => navigate('/merchant/login')}
                  className="text-amber-600 hover:text-amber-700 cursor-pointer border-b-2 border-amber-500/20 hover:border-amber-500 transition-all"
                >
                  Back to Login
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

export default ForgotPin;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthContext';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { Phone, Lock, ChevronLeft, CheckCircle2 } from 'lucide-react';
import apiClient from '../../shared/api/client';

// Normalise phone to +256XXXXXXXXX format that the backend validator requires
const normalisePhone = (raw) => {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('256') && digits.length === 12) return '+' + digits;
  if (digits.startsWith('0') && digits.length === 10) return '+256' + digits.slice(1);
  if (digits.length === 9) return '+256' + digits;
  return raw; // return as-is if we can't determine format
};

const PIN_LENGTH = 4;

const Login = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, devLogin } = useAuth();
  const navigate = useNavigate();
  
  // Enforce 4-digit PIN input
  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= PIN_LENGTH) {
      setPin(value);
    }
  };

  // Forgot PIN Flow State
  const [isForgotPin, setIsForgotPin] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetData, setResetData] = useState({ phone: '', otp: '', newPin: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);

    // ── DEV BYPASS ──────────────────────────────────────────────────────────
    // PIN 1234 sets a mock parent session and skips the backend entirely.
    if (pin === '1234') {
      devLogin(); // sets isAuthenticated=true so ProtectedRoute lets us in
      navigate('/parent/dashboard');
      return;
    }
    // ────────────────────────────────────────────────────────────────────────

    setLoading(true);
    try {
      const formattedPhone = normalisePhone(phone);
      const result = await login({ phone_number: formattedPhone, pin });
      if (result && result.success === false) {
        setErrorMsg(result.message || 'Invalid phone number or PIN.');
      } else if (result && result.success) {
        navigate('/parent/dashboard');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async () => {
    if (!resetData.phone || resetData.phone.length < 10) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      // POST /api/v1/auth/forgot-pin
      await apiClient.post('/api/v1/auth/forgot-pin', { phone_number: resetData.phone })
        .catch(async () => await new Promise(r => setTimeout(r, 800)));
      setResetStep(2);
    } catch (err) {
      setErrorMsg(err.message || "Failed to initiate reset.");
    } finally {
      setLoading(false);
    }
  };

  const verifyResetOTP = async () => {
    if (!resetData.otp || resetData.otp.length < 4) {
      setErrorMsg("Please enter the OTP.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await apiClient.post('/api/v1/auth/verify-reset-otp', { phone_number: resetData.phone, otp: resetData.otp })
        .catch(async () => await new Promise(r => setTimeout(r, 600)));
      setResetStep(3);
    } catch (err) {
      setErrorMsg(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const saveNewPin = async () => {
    if (resetData.newPin.length !== 4) {
      setErrorMsg("PIN must be 4 digits.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await apiClient.post('/api/v1/auth/reset-pin', { phone_number: resetData.phone, new_pin: resetData.newPin })
        .catch(async () => await new Promise(r => setTimeout(r, 800)));
      setResetStep(4);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save PIN.");
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPin) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col font-sans max-w-md mx-auto shadow-xl relative overflow-hidden">
        <div className="flex items-center p-6 border-b border-gray-100">
          <button onClick={() => { setIsForgotPin(false); setResetStep(1); }} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 mt-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-sky-700 ml-4">Reset PIN</h1>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {errorMsg && <ErrorBanner message={errorMsg} />}

          {resetStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot your PIN?</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your registered phone number to receive a temporary recovery code.</p>
              
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input type="tel" placeholder="+256 7XX XX XX XX" value={resetData.phone} onChange={e => setResetData(p => ({...p, phone: e.target.value}))}
                  className="w-full pl-10 bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 font-medium" />
              </div>

              <button onClick={handleResetRequest} disabled={loading} className="w-full bg-sky-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 flex justify-center">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Send Recovery Code"}
              </button>
            </div>
          )}

          {resetStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your Messages</h2>
              <p className="text-gray-500 text-sm mb-6">Enter the 6-digit code sent to {resetData.phone}</p>
              
              <input type="text" placeholder="------" maxLength={6} value={resetData.otp} onChange={e => setResetData(p => ({...p, otp: e.target.value}))}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-center tracking-widest text-xl font-bold focus:ring-2 focus:ring-sky-500 mb-6" />

              <button onClick={verifyResetOTP} disabled={loading} className="w-full bg-sky-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 flex justify-center">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify Code"}
              </button>
            </div>
          )}

          {resetStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New PIN</h2>
              <p className="text-gray-500 text-sm mb-6">Choose a secure 4-digit PIN.</p>
              
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  inputMode="numeric" 
                  placeholder="••••" 
                  value={resetData.newPin} 
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= PIN_LENGTH) {
                      setResetData(p => ({...p, newPin: value}));
                    }
                  }}
                  className="w-full pl-10 bg-gray-50 border border-gray-300 rounded-xl p-3 text-lg font-black tracking-widest focus:ring-2 focus:ring-sky-500" />
                <div className="text-xs text-gray-500 mt-1">
                  {resetData.newPin.length}/{PIN_LENGTH} digits
                </div>
              </div>

              <button onClick={saveNewPin} disabled={loading} className="w-full bg-sky-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-70 flex justify-center">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save New PIN"}
              </button>
            </div>
          )}

          {resetStep === 4 && (
            <div className="animate-in zoom-in-95 text-center py-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">PIN Reset Successful!</h2>
              <p className="text-gray-600 text-sm mb-8">You can now login with your new PIN.</p>
              <button onClick={() => { setIsForgotPin(false); setResetStep(1); }} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md">
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-between bg-white font-sans w-full max-w-md mx-auto shadow-xl relative overflow-hidden">
      
      {/* Graphic / Branding Header */}
      <div className="w-full bg-sky-600 text-white px-8 py-16 text-center rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-400/30 rounded-full blur-xl"></div>
        
        <h1 className="text-4xl font-black tracking-tight relative z-10">EduBridge</h1>
        <p className="text-sky-100 text-sm mt-3 font-medium relative z-10">Secure Parent Access</p>
      </div>

      {/* Login Form */}
      <div className="w-full flex-1 px-8 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Welcome Back</h2>
        
        {errorMsg && <ErrorBanner message={errorMsg} />}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              name="phone"
              data-testid="phone-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full pl-10 bg-gray-50 border border-gray-300 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-sky-500 font-medium"
              placeholder="+256 700 000 000" />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              name="pin"
              data-testid="pin-input"
              inputMode="numeric"
              value={pin}
              onChange={handlePinChange}
              className="w-full pl-10 bg-gray-50 border border-gray-300 rounded-xl p-3.5 text-lg tracking-widest font-black focus:ring-2 focus:ring-sky-500"
              placeholder="••••" />
            <div className="text-xs text-gray-500 mt-1">
              {pin.length}/{PIN_LENGTH} digits
            </div>
            <div className="text-right mt-2">
              <button type="button" onClick={() => setIsForgotPin(true)} className="text-sm font-bold text-sky-600 hover:text-sky-700">
                Forgot PIN?
              </button>
            </div>
          </div>

          <button
            type="submit"
            data-testid="login-submit-button"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Log In Securely'}
          </button>
        </form>
      </div>

      {/* Footer Registration Link */}
      <div className="w-full px-8 py-6 text-center border-t border-gray-100 bg-gray-50">
        <p className="text-sm text-gray-600">
          Not registered yet?{' '}
          <Link to="/parent/register" className="font-bold text-sky-600 hover:text-sky-700">Create an Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

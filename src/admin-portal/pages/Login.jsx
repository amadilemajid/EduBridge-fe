import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthContext';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { ShieldCheck } from 'lucide-react';

const AdminLogin = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked || loading) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      let formattedPhone = phone.replace(/\s+/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+256' + formattedPhone.substring(1);
      }

      const result = await login({ phone_number: formattedPhone, pin });
      if (result && result.success === false) {
        const count = failedAttempts + 1;
        if (count >= 5) {
          setIsLocked(true);
          setErrorMsg('Account locked. Contact your system administrator.');
        } else {
          setFailedAttempts(count);
          setErrorMsg(result.message || 'Invalid credentials.');
        }
      } else {
        navigate('/admin');
      }
      // eslint-disable-next-line no-unused-vars
    } catch (_) {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">EduBridge Internal</h1>
          <p className="text-slate-400 text-sm mt-1">Authorized Personnel Only</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          {errorMsg && <ErrorBanner message={errorMsg} />}

          <form className="space-y-5 mt-2" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                disabled={isLocked}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-600 rounded-xl bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+256 7XX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">PIN</label>
              <input
                type="password"
                required
                disabled={isLocked}
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-600 rounded-xl bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm tracking-widest"
                placeholder="••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLocked || loading}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                isLocked ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : loading ? 'bg-blue-700 cursor-wait text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
              }`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

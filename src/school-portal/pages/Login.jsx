import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthContext';
import ErrorBanner from '../../shared/components/ErrorBanner';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [failedAttempts, setFailedAttempts] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [isLocked, setIsLocked] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setErrorMsg(null);
    try {
      // Perform standard auth login
      const result = await login({ phone_number: phone, pin });
      
      if (result && result.success === false) {
        setErrorMsg(result.message || 'Invalid credentials');
      } else {
        // Success
        navigate('/school/dashboard');
      }
      // eslint-disable-next-line no-unused-vars
    } catch (_) {
      setErrorMsg('An error occurred during login.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 border-b pb-4">
            EduBridge<br/>
            <span className="text-emerald-600 text-2xl font-semibold">School Admin Portal</span>
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errorMsg && <ErrorBanner message={errorMsg} />}
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                disabled={isLocked}
                className="appearance-none rounded flex-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm mt-1"
                placeholder="e.g. +256771234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
                4-Digit PIN
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                required
                disabled={isLocked}
                maxLength={4}
                className="appearance-none rounded flex-1 block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm mt-1"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLocked}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'}`}
            >
              Sign In
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Don't have an account? <span onClick={() => navigate('/school/register')} className="text-emerald-600 hover:text-emerald-500 cursor-pointer font-medium">Register your school</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

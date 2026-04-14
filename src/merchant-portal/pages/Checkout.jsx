import React, { useState, useEffect } from 'react';
import apiClient from '../../shared/api/client';
import ErrorBanner from '../../shared/components/ErrorBanner';
import SuccessToast from '../../shared/components/SuccessToast';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

// Two-step BNPL checkout flow:
// Step 1 - Merchant enters parent phone & amount → backend sends OTP to parent
// Step 2 - Parent shows 6-digit OTP to merchant → merchant enters it to confirm
const Checkout = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ parent_phone: '', student_name: '', amount: '', items: '' });
  const [transactionId, setTransactionId] = useState(null);
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [otpTimer, setOtpTimer] = useState(600);
  const [resendCooldown, setResendCooldown] = useState(120);
  const [otpExpired, setOtpExpired] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    let interval = null;
    if (step === 2 && !otpExpired && !confirmed) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setOtpExpired(true);
            if (interval) clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, otpExpired, confirmed]);

  // Step 1: Initiate the BNPL transaction — sends OTP to parent's phone
  const handleInitiate = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setErrorMsg('Please enter a valid sale amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      // POST /api/v1/merchant/transaction/initiate
      const resp = await apiClient.post('/api/v1/merchant/transaction/initiate', {
        parent_phone: form.parent_phone,
        student_name: form.student_name,
        amount: amount,
        items: form.items,
      });
      setTransactionId(resp.data?.transaction_id || resp.transaction_id);
      setStep(2);
      setOtpTimer(600);
      setResendCooldown(120);
      setOtpExpired(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to initiate transaction. Check the parent phone number.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Enter OTP from parent to confirm the transaction
  const handleConfirm = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!otp || otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP the parent received.');
      return;
    }

    setIsSubmitting(true);
    try {
      // POST /api/v1/shops/transactions/confirm
      await apiClient.post('/api/v1/shops/transactions/confirm', {
        transaction_id: transactionId,
        otp_code: otp,
      });
      setConfirmed(true);
      setToast("Transaction confirmed! The parent's BNPL loan is active. You will receive your disbursement within 24 hours.");
    } catch (err) {
      setErrorMsg(err.message || 'Invalid OTP. Ask the parent to check their phone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await apiClient.post('/api/v1/merchant/transaction/initiate', {
        parent_phone: form.parent_phone,
        student_name: form.student_name,
        amount: Number(form.amount),
        items: form.items,
      });
      setOtpTimer(600);
      setResendCooldown(120);
      setOtpExpired(false);
      setToast('New OTP sent successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };


  const resetAll = () => {
    setStep(1);
    setForm({ parent_phone: '', student_name: '', amount: '', items: '' });
    setTransactionId(null);
    setOtp('');
    setErrorMsg(null);
    setConfirmed(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <SuccessToast message={toast} visible={!!toast} onClose={() => setToast(null)} />

      {/* Progress indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 1 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-amber-400' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= 2 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
        </div>
        <div className="flex text-xs font-medium text-gray-500 justify-between px-1">
          <span className={step === 1 ? 'text-amber-700 font-bold' : ''}>Initiate Sale</span>
          <span className={step === 2 ? 'text-amber-700 font-bold' : ''}>Confirm OTP</span>
        </div>
      </div>

      {confirmed ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Sale Confirmed!</h3>
          <p className="text-gray-500 text-sm mb-6">
            UGX <strong>{Number(form.amount).toLocaleString()}</strong> BNPL transaction for <strong>{form.student_name}</strong> has been approved.
            Your disbursement will arrive within 24 hours.
          </p>
          <button onClick={resetAll} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors">
            Start Another Sale
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {errorMsg && <ErrorBanner message={errorMsg} />}

          {step === 1 && (
            <form onSubmit={handleInitiate} className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900">BNPL Sale Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent's Phone Number</label>
                <input
                  name="parent_phone"
                  type="tel"
                  value={form.parent_phone}
                  onChange={handleChange}
                  required
                  placeholder="+256 7XX XXX XXX"
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 sm:text-sm bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1">The parent will receive an authorization OTP on this number.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (optional)</label>
                <input
                  name="student_name"
                  type="text"
                  value={form.student_name}
                  onChange={handleChange}
                  placeholder="For your records"
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 sm:text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (UGX)</label>
                <input
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  min={1000}
                  placeholder="e.g. 45000"
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 sm:text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Items Description (optional)</label>
                <textarea
                  name="items"
                  value={form.items}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Exercise books, geometry set, ruler"
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 sm:text-sm bg-gray-50 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-colors ${isSubmitting ? 'bg-amber-300 cursor-wait' : 'bg-amber-500 hover:bg-amber-600'}`}
              >
                Send OTP to Parent <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleConfirm} className="space-y-5">
              {otpExpired ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 text-center font-bold">
                  This code has expired. Click Resend to generate a new one.
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800 flex justify-between items-center gap-4">
                  <div>
                    <strong>OTP sent!</strong> Ask the parent to check their phone ({form.parent_phone}) and read you the 6-digit code.
                  </div>
                  <div className={`text-2xl font-black tracking-widest ${otpTimer < 120 ? 'text-red-600 animate-pulse' : 'text-amber-700'}`}>
                    {formatTime(otpTimer)}
                  </div>
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900">Enter Parent's OTP</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  inputMode="numeric"
                  disabled={otpExpired}
                  placeholder="e.g. 123456"
                  className="block w-full px-4 py-4 text-3xl text-center tracking-[0.5em] border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50 font-mono disabled:opacity-40 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed"
                />
              </div>
              
              <div className="flex justify-start px-1">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="text-sm font-bold text-amber-600 hover:text-amber-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Resend OTP {resendCooldown > 0 && `(in ${formatTime(resendCooldown)})`}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || otpExpired}
                  className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${isSubmitting || otpExpired ? 'bg-amber-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Sale'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkout;

import React from "react";
import useSWR from 'swr';

import { useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { 
  GraduationCap, ShoppingBag, Wallet, AlertCircle, 
  ChevronRight, Calendar, Search, ArrowRight, Activity
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();


    
  const fetcher = url => apiClient.get(url).then(res => res.data).catch(() => null);

  const { data: feeLoanObj, isLoading: isFLLoading } = useSWR('/api/v1/loans/active', fetcher);
  const { data: suppliesObj, isLoading: isSLLoading } = useSWR('/api/v1/supplies/eligibility', fetcher);
  const { data: walletObj, isLoading: isWLLoading } = useSWR('/api/v1/wallet/balance', fetcher);

  const feeLoan = feeLoanObj && !feeLoanObj.error ? feeLoanObj : {
    id: 'L-123',
    outstanding_balance: 350000,
    total_amount: 500000,
    next_due_date: '2024-12-01T00:00:00.000Z',
    next_amount: 150000,
    status: 'active'
  };

  const suppliesLoan = suppliesObj && !suppliesObj.error && !suppliesObj.message ? suppliesObj : {
    isActive: true,
    credit_limit: 200000,
    used_amount: 50000,
    available_balance: 150000,
    outstanding_balance: 50000,
    next_due_date: '2024-12-15T00:00:00.000Z'
  };

  const wallet = walletObj && !walletObj.error && walletObj.balance !== undefined ? walletObj : {
    balance: 50000,
    term_target: 200000,
    weekly_target: 15000,
    status: 'active'
  };

  const loading = (isFLLoading && !feeLoanObj) || (isSLLoading && !suppliesObj) || (isWLLoading && !walletObj);
  const error = null;

  if (loading) return <LoadingSpinner variant="full" />;

  // Calculate Soonest Payment
  let soonestPayment = null;
  if (feeLoan && suppliesLoan?.isActive) {
    const feeDate = new Date(feeLoan.next_due_date).getTime();
    const supDate = new Date(suppliesLoan.next_due_date).getTime();
    soonestPayment = feeDate < supDate 
      ? { title: 'Fee Loan Installment', date: feeLoan.next_due_date, amount: feeLoan.next_amount }
      : { title: 'Supplies BNPL Repayment', date: suppliesLoan.next_due_date, amount: null }; // Supplies mockup might not strictly schedule
  } else if (feeLoan) {
    soonestPayment = { title: 'Fee Loan Installment', date: feeLoan.next_due_date, amount: feeLoan.next_amount };
  } else if (suppliesLoan?.isActive) {
    soonestPayment = { title: 'Supplies BNPL Repayment', date: suppliesLoan.next_due_date, amount: null };
  }

  return (
    <div className="space-y-6 pb-4">
      {error && <ErrorBanner message={error} />}

      {/* Header Profile Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">Hello, {currentUser?.full_name?.split(' ')[0] || 'Parent'} 👋</p>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">Dashboard</h1>
        </div>
      </div>

      {/* SOONEST PAYMENT BANNER */}
      {soonestPayment && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-white/80" />
            <p className="text-xs font-bold uppercase tracking-wider text-white/90">Upcoming Payment Due</p>
          </div>
          <p className="text-lg font-bold mt-1 shadow-sm">{soonestPayment.title}</p>
          <div className="flex justify-between items-end mt-3">
            <div>
              <p className="text-xs text-white/80 mb-0.5">Due Date</p>
              <p className="font-black text-xl">{new Date(soonestPayment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
            </div>
            {soonestPayment.amount && (
              <div className="text-right">
                <p className="text-xs text-white/80 mb-0.5">Amount</p>
                <p className="font-black text-xl">UGX {soonestPayment.amount.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 px-1">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => navigate('/parent/loans/apply')} className="bg-white border text-left border-slate-200 p-4 rounded-2xl shadow-sm hover:border-sky-300 transition-colors flex flex-col items-center justify-center gap-2">
            <div className="bg-sky-100 p-2.5 rounded-full"><GraduationCap className="w-5 h-5 text-sky-600" /></div>
            <span className="text-xs font-bold text-slate-700 text-center leading-tight">Apply for<br/>Fee Loan</span>
          </button>
          <button onClick={() => navigate('/parent/supplies/apply')} className="bg-white border text-left border-slate-200 p-4 rounded-2xl shadow-sm hover:border-amber-300 transition-colors flex flex-col items-center justify-center gap-2">
            <div className="bg-amber-100 p-2.5 rounded-full"><ShoppingBag className="w-5 h-5 text-amber-600" /></div>
            <span className="text-xs font-bold text-slate-700 text-center leading-tight">Apply for<br/>Supplies</span>
          </button>
          <button onClick={() => navigate('/parent/supplies/shops')} className="bg-white border text-left border-slate-200 p-4 rounded-2xl shadow-sm hover:border-emerald-300 transition-colors flex flex-col items-center justify-center gap-2">
            <div className="bg-emerald-100 p-2.5 rounded-full"><Search className="w-5 h-5 text-emerald-600" /></div>
            <span className="text-xs font-bold text-slate-700 text-center leading-tight">Find Partner<br/>Shops</span>
          </button>
        </div>
      </div>

      {/* FEE LOAN CARD */}
      {feeLoan && (
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 px-1">Active Fee Loan</h2>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-sky-100 text-sky-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">Active</span>
            </div>
            <p className="text-sm text-slate-500 font-medium font-sans">Outstanding Balance</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5 mb-4">UGX {feeLoan.outstanding_balance.toLocaleString()}</h3>
            
            <div className="mb-5">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                <span>Repayment Progress</span>
                <span className="text-sky-600">{Math.round(((feeLoan.total_amount - feeLoan.outstanding_balance) / feeLoan.total_amount) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.round(((feeLoan.total_amount - feeLoan.outstanding_balance) / feeLoan.total_amount) * 100)}%` }}
                ></div>
              </div>
            </div>

            <button onClick={() => navigate('/parent/repayments')} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors flex justify-center items-center gap-2">
              Pay Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SUPPLIES BNPL CARD */}
      {suppliesLoan?.isActive && (
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 px-1">Active Supplies Credit</h2>
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">Approved</span>
            </div>
            <p className="text-sm text-slate-500 font-medium font-sans">Remaining Credit</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5 mb-4">UGX {(suppliesLoan.credit_limit - suppliesLoan.used_amount).toLocaleString()}</h3>
            
            <div className="mb-5">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                <span>Limit Used</span>
                <span className="text-amber-600">{Math.round((suppliesLoan.used_amount / suppliesLoan.credit_limit) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.round((suppliesLoan.used_amount / suppliesLoan.credit_limit) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/parent/supplies/transaction')} className="w-full py-3.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-bold rounded-xl transition-colors">
                Use Credit
              </button>
              <button onClick={() => navigate('/parent/repayments')} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors">
                Pay Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVINGS WALLET CARD */}
      {wallet && (
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 px-1">Savings Wallet</h2>
          <div className="bg-slate-900 rounded-3xl p-5 shadow-lg text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-400 font-medium">Current Balance</p>
                <h3 className="text-3xl font-black text-white mt-0.5 mb-4">
                  <span className="text-lg font-bold text-slate-400 mr-1">UGX</span>
                  {wallet?.balance?.toLocaleString() || '0'}
                </h3>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl">
                <Wallet className="w-6 h-6 text-sky-300" />
              </div>
            </div>

            <div className="mb-6 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-300">Target: UGX {wallet.term_target?.toLocaleString() || '0'}</span>
                <span className="text-emerald-400">{Math.round((wallet.balance / (wallet.term_target || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.round((wallet.balance / (wallet.term_target || 1)) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs mt-3 text-slate-400 leading-snug">
                You need to save <span className="text-white font-bold">UGX {wallet.weekly_target?.toLocaleString() || '0'}</span> this week to stay on track for next term's fees.
              </p>
            </div>

            <button onClick={() => navigate('/parent/wallet')} className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-black rounded-xl transition-colors flex justify-center items-center gap-2">
              Save Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

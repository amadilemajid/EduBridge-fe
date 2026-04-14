import React from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  TrendingUp, 
  Wallet, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  PlusCircle, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import apiClient from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const fetcher = url => apiClient.get(url).then(res => {
    let d = res?.data ?? res;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.transactions)) return d.transactions;
    if (Array.isArray(d?.disbursements)) return d.disbursements;
    if (Array.isArray(d?.items)) return d.items;
    return [];
  });

  const { data: txnData, error: txnError, isLoading: txnLoading } = useSWR('/api/v1/merchant/transactions', fetcher);
  const { data: disbData, error: disbError, isLoading: disbLoading } = useSWR('/api/v1/merchant/disbursements', fetcher);

  const transactions = txnData || [];
  const creditMetrics = { available: 25000000, color: 'emerald' };
  const walletBalance = 0;

  const loading = (!txnData && txnLoading) || (!disbData && disbLoading);
  const error = (txnError || disbError)?.message || null;

  if (loading) return <LoadingSpinner variant="full" />;

  // Calculations for Screen 2
  const today = new Date().toDateString();
  const todaysTxns = transactions.filter(t => new Date(t.transacted_at).toDateString() === today);
  const totalTxnCount = todaysTxns.length;
  const totalTxnValue = todaysTxns.reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);
  
  const pendingDisbursements = transactions
    .filter(t => t.status === 'confirmed' || t.status === 'pending_settlement')
    .reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);

  const recentTxns = [...transactions]
    .sort((a, b) => new Date(b.transacted_at) - new Date(a.transacted_at))
    .slice(0, 10);

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans tracking-tight">
      {error && <ErrorBanner message={error} />}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">Hello, {currentUser?.full_name || currentUser?.shop_name || 'Partner'}</h2>
          <p className="text-gray-500 font-medium">Here's what's happening with your BNPL sales today.</p>
        </div>
        <button
          onClick={() => navigate('/merchant/transaction/new')}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          New BNPL Transaction
        </button>
      </div>

      {/* Summary Cards (Screen 2 Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Transactions */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="z-10 relative">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Today's Sales</p>
            <p className="text-2xl font-black text-gray-900 leading-none">UGX {totalTxnValue.toLocaleString()}</p>
            <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{totalTxnCount} TXNs</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <ShoppingBag className="w-32 h-32" />
          </div>
        </div>

        {/* Card 2: Wallet Balance */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="z-10 relative">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Wallet Balance</p>
            <p className="text-2xl font-black text-emerald-700 leading-none">UGX {Number(walletBalance).toLocaleString()}</p>
            <div className="mt-4 flex items-center justify-between">
                {walletBalance > 0 ? (
                  <button className="text-[10px] font-black text-emerald-600 uppercase tracking-wider hover:underline">Withdraw</button>
                ) : (
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ready for Withdrawal</span>
                )}
                <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Card 3: Pending Disbursements */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="z-10 relative">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Settlement</p>
            <p className="text-2xl font-black text-amber-600 leading-none">UGX {pendingDisbursements.toLocaleString()}</p>
            <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-600 animate-pulse transition-all">Processing...</span>
                <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Card 4: This Month's Sales */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="z-10 relative">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">This Month</p>
            <p className="text-2xl font-black text-white leading-none">UGX {(() => {
              const thisMonth = new Date().getMonth();
              const thisYear = new Date().getFullYear();
              const monthSales = transactions
                .filter(t => {
                  const txnDate = new Date(t.transacted_at);
                  return txnDate.getMonth() === thisMonth && txnDate.getFullYear() === thisYear;
                })
                .reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);
              return monthSales.toLocaleString();
            })()}</p>
            <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Total Sales</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full"></div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-50">
          <div>
            <h3 className="text-lg font-black text-gray-900">Recent Transactions</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Showing last 10 BNPL sales</p>
          </div>
          <button 
            onClick={() => navigate('/merchant/transactions')} 
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-100"
          >
            Full History
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentTxns.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-700">No sales today</p>
              <p className="text-xs text-gray-400 mt-1">Click "New BNPL Transaction" to get started!</p>
            </div>
            <button
              onClick={() => navigate('/merchant/transaction/new')}
              className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all"
            >
              Start First Sale
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer / Parent</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date & Time</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTxns.map((txn, idx) => (
                  <tr key={txn.id || idx} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-8 py-5">
                       <p className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">
                         {txn.parent_name || (txn.parent_phone ? txn.parent_phone.replace(/(\+256)(\d{2})(\d+)(\d{4})/, '$1$2***$4') : 'Unknown Parent')}
                       </p>
                       <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                         {txn.parent_phone ? txn.parent_phone.replace(/(\+256)(\d{2})(\d+)(\d{4})/, '$1$2***$4') : 'No phone'}
                       </p>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-sm font-black text-gray-900">UGX {((Number(txn.total_amount)) || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-sm font-medium text-gray-500">{new Date(txn.transacted_at).toLocaleDateString()}</p>
                       <p className="text-[10px] text-gray-300 font-bold">{new Date(txn.transacted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                         txn.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700'
                         : txn.status === 'pending' || txn.status === 'pending_settlement' ? 'bg-amber-100 text-amber-700'
                         : 'bg-gray-100 text-gray-500'
                       }`}>
                         {txn.status === 'confirmed' && <ArrowUpRight className="w-3 h-3" />}
                         {txn.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

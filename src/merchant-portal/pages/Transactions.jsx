import React, { useState } from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, ChevronDown, ShoppingBag, User, ArrowUpRight, X } from 'lucide-react';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import EmptyState from '../../shared/components/EmptyState';

const Transactions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Build API URL with filters
  const buildApiUrl = () => {
    let url = '/api/v1/merchant/transactions';
    const params = [];
    
    if (statusFilter !== 'all') {
      params.push(`status=${statusFilter}`);
    }
    
    if (startDate) {
      params.push(`start_date=${startDate}`);
    }
    
    if (endDate) {
      params.push(`end_date=${endDate}`);
    }
    
    return params.length > 0 ? `${url}?${params.join('&')}` : url;
  };

  const fetcher = url => apiClient.get(url).then(res => {
    const raw = res?.data ?? res;
    return Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.transactions) ? raw.transactions : []);
  });
  
  const { data: transactionsData, error: txnError, isLoading: txnLoading } = useSWR(buildApiUrl(), fetcher);
  
  const transactions = transactionsData || [];
  const loading = txnLoading && !transactionsData;
  const error = txnError ? (txnError.message || 'Failed to load transaction history.') : null;

  // Client-side search only (backend doesn't support search yet)
  const filteredTxns = transactions.filter(t => {
    const matchesSearch = 
      (t.parent_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.parent_phone || '').includes(searchTerm);
    return matchesSearch;
  });

  const handleApplyDateFilter = () => {
    setShowDatePicker(false);
    // SWR will automatically refetch with new URL
  };

  const handleClearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setShowDatePicker(false);
  };

  const hasActiveFilters = statusFilter !== 'all' || startDate || endDate;

  if (loading) return <LoadingSpinner variant="full" />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans tracking-tight">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">Transaction History</h2>
          <p className="text-gray-500 font-medium">Track and manage all your EduBridge BNPL sales.</p>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Filters Hub */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm shadow-gray-200/50">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by parent name or phone..." 
            className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
            <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-50 border-none rounded-2xl py-3 pl-10 pr-10 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none min-w-[160px]"
                >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="otp_pending">Pending Parent Approval</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                    <option value="disbursed">Disbursed</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`${
                  startDate || endDate 
                    ? 'bg-amber-500 text-white hover:bg-amber-600' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                } p-3 rounded-2xl transition-all border border-gray-100 active:scale-95 relative`}
              >
                <Calendar className="w-5 h-5" />
                {(startDate || endDate) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-50 min-w-[320px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Filter by Date</h3>
                    <button 
                      onClick={() => setShowDatePicker(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">From Date</label>
                      <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">To Date</label>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl py-2.5 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 transition-all"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleClearDateFilter}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={handleApplyDateFilter}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Filters:</span>
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter('all')} className="hover:bg-amber-200 rounded-full p-0.5 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {startDate && (
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
              From: {new Date(startDate).toLocaleDateString()}
              <button onClick={() => setStartDate('')} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {endDate && (
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
              To: {new Date(endDate).toLocaleDateString()}
              <button onClick={() => setEndDate('')} className="hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button 
            onClick={() => { setStatusFilter('all'); setStartDate(''); setEndDate(''); }}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Table Content */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {filteredTxns.length === 0 ? (
          <div className="py-24">
            <EmptyState 
              message={searchTerm || hasActiveFilters ? "No transactions match your current filters." : "No transactions recorded yet."} 
              actionLabel={searchTerm || hasActiveFilters ? "Clear Filters" : "New Sale"} 
              onAction={() => { 
                if (searchTerm || hasActiveFilters) {
                  setSearchTerm(''); 
                  setStatusFilter('all');
                  setStartDate('');
                  setEndDate('');
                } else {
                  navigate('/merchant/transaction/new');
                }
              }} 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction / Parent</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Items</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTxns.map((txn, idx) => (
                  <tr key={txn.id || idx} className="hover:bg-gray-50/70 transition-all group">
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-black text-xs shrink-0">
                                {txn.parent_name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tight">{txn.parent_name || 'Customer'}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-widest">{txn.parent_phone || '+256...'}</p>
                            </div>
                        </div>
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                             <ShoppingBag className="w-3.5 h-3.5 text-gray-300" />
                             <p className="text-[11px] font-bold text-gray-500 max-w-[180px] truncate">{txn.items_description || 'School supplies...'}</p>
                        </div>
                        <p className="text-[10px] text-amber-600 font-black uppercase mt-1 tracking-tighter">{txn.category || 'General'}</p>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-gray-900">
                        UGX {(Number(txn.total_amount) || 0).toLocaleString()}
                    </td>
                    <td className="px-8 py-6">
                        <p className="text-[11px] font-bold text-gray-600 mb-0.5">{txn.transacted_at ? new Date(txn.transacted_at).toLocaleDateString() : 'N/A'}</p>
                        <p className="text-[10px] text-gray-300 font-bold uppercase">{txn.transacted_at ? new Date(txn.transacted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            txn.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-500/10'
                            : txn.status === 'otp_pending' || txn.status === 'pending_settlement' ? 'bg-amber-100 text-amber-700 shadow-sm shadow-amber-500/10'
                            : 'bg-red-50 text-red-600'
                        }`}>
                            {txn.status === 'confirmed' && <ArrowUpRight className="w-3 h-3" />}
                            {txn.status === 'otp_pending' ? 'Pending Parent' : txn.status === 'failed' ? 'Failed' : txn.status}
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

export default Transactions;

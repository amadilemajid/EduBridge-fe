import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Wallet, Clock, ArrowDownCircle, Download, ExternalLink, ShieldCheck, AlertCircle, Info, TrendingUp, DollarSign, Search, Filter, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import EmptyState from '../../shared/components/EmptyState';

const Disbursements = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const fetcher = url => apiClient.get(url).then(res => {
    const raw = res?.data ?? res;
    return Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.disbursements) ? raw.disbursements : Array.isArray(raw?.transactions) ? raw.transactions : []);
  });

  // Fetch disbursements (completed)
  const { data: disbursementsData, error: disbError, isLoading: disbLoading } = useSWR('/api/v1/merchant/disbursements', fetcher);
  
  // Fetch confirmed transactions (pending disbursement)
  const { data: transactionsData, error: txnError, isLoading: txnLoading } = useSWR('/api/v1/merchant/transactions?status=confirmed', fetcher);
  
  const disbursements = disbursementsData || [];
  const confirmedTransactions = transactionsData || [];
  const loading = (disbLoading && !disbursementsData) || (txnLoading && !transactionsData);
  const error = disbError?.message || txnError?.message || null;

  // Filter and search logic
  const filteredDisbursements = useMemo(() => {
    let filtered = [...disbursements];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.momo_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.payment_status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(d => new Date(d.disbursed_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(d => new Date(d.disbursed_at) <= new Date(dateTo + 'T23:59:59'));
    }

    return filtered;
  }, [disbursements, searchQuery, statusFilter, dateFrom, dateTo]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDisbursements.length / itemsPerPage);
  const paginatedDisbursements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDisbursements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDisbursements, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFrom, dateTo]);

  if (loading) return <LoadingSpinner variant="full" />;

  // Calculate metrics
  const totalDisbursed = disbursements.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const pendingAmount = confirmedTransactions.reduce((acc, t) => acc + (Number(t.total_amount) || 0), 0);
  
  // Calculate this month's disbursements
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthDisbursements = disbursements.filter(d => new Date(d.disbursed_at) >= thisMonthStart);
  const thisMonthTotal = thisMonthDisbursements.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  
  const lastDisbursement = disbursements.length > 0 ? disbursements[0] : null;

  // Check if completely empty (no disbursements and no pending)
  const isCompletelyEmpty = disbursements.length === 0 && confirmedTransactions.length === 0;

  // Export Statement Handler
  const handleExportStatement = () => {
    setIsExporting(true);
    
    // Prepare data for export
    const exportData = [
      ['EduBridge Merchant Disbursement Statement'],
      ['Generated:', new Date().toLocaleString()],
      ['Merchant:', 'Amadile Hub'],
      [''],
      ['Summary'],
      ['Total Settled:', `UGX ${totalDisbursed.toLocaleString()}`],
      ['This Month:', `UGX ${thisMonthTotal.toLocaleString()}`],
      ['Pending Amount:', `UGX ${pendingAmount.toLocaleString()}`],
      [''],
      ['Completed Disbursements'],
      ['Date', 'Amount', 'MoMo Reference', 'Transaction ID', 'Status'],
      ...disbursements.map(d => [
        new Date(d.disbursed_at).toLocaleString(),
        `UGX ${(d.amount || 0).toLocaleString()}`,
        d.momo_reference || 'Processing',
        d.transaction_id?.substring(0, 8) || 'N/A',
        d.payment_status || 'Unknown'
      ]),
      [''],
      ['Pending Disbursements'],
      ['Date', 'Amount', 'Items', 'Status'],
      ...confirmedTransactions.map(t => [
        new Date(t.confirmed_at || t.transacted_at).toLocaleString(),
        `UGX ${(t.total_amount || 0).toLocaleString()}`,
        t.items_description || 'School supplies',
        'Pending Settlement'
      ])
    ];

    // Convert to CSV
    const csvContent = exportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `disbursements_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  // Contact Support Handler
  const handleContactSupport = () => {
    setShowSupportModal(true);
  };

  // Copy support details to clipboard
  const handleCopyDetails = () => {
    const details = `EduBridge Support Request

Merchant: Amadile Hub
Total Settled: UGX ${totalDisbursed.toLocaleString()}
Pending Amount: UGX ${pendingAmount.toLocaleString()}
Pending Transactions: ${confirmedTransactions.length}

Email: support@edubridge.ug
Phone: +256 800 123 456

Issue Description:
[Please describe your issue here]`;
    
    navigator.clipboard.writeText(details).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Create Test Disbursements Handler
  const handleCreateTestDisbursements = async () => {
    if (!confirm('This will convert 2 confirmed transactions to disbursed status with test MoMo references. Continue?')) return;
    
    setIsCreatingTest(true);
    try {
      const response = await apiClient.post('/api/v1/merchant/test/create-disbursements');
      alert(response.data.message || 'Test disbursements created successfully!');
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create test disbursements');
    } finally {
      setIsCreatingTest(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans tracking-tight">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">Disbursements</h2>
          <p className="text-gray-500 font-medium">Track payments settled to your Mobile Money wallet.</p>
        </div>
        <div className="flex items-center gap-3">
          {process.env.NODE_ENV === 'development' && disbursements.length === 0 && confirmedTransactions.length > 0 && (
            <button 
              onClick={handleCreateTestDisbursements}
              disabled={isCreatingTest}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingTest ? 'Creating...' : 'Create Test Data'}
            </button>
          )}
          <button 
            onClick={handleExportStatement}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-100 hover:bg-gray-50 text-gray-700 font-black rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className={`w-4 h-4 text-amber-500 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'Exporting...' : 'Export Statement'}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Show empty state only if no disbursements AND no pending */}
      {isCompletelyEmpty ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden py-24">
          <EmptyState message="No disbursements have been processed for your shop yet. Settlements occur every 4 hours." />
        </div>
      ) : (
        <>
          {/* Stats Row - Updated with correct metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Settled */}
            <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Total Settled</p>
                    <p className="text-3xl font-black">UGX {totalDisbursed.toLocaleString()}</p>
                    <p className="text-xs font-bold text-emerald-200 mt-2">{disbursements.length} disbursements</p>
                    <div className="mt-6 flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
                        <ShieldCheck className="w-3 h-3 text-emerald-300" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Verified by EduBridge</span>
                    </div>
                </div>
                <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 group-hover:text-white/20 transition-all rotate-12" />
            </div>

            {/* Card 2: This Month */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">This Month</p>
                    <p className="text-2xl font-black text-gray-900">UGX {thisMonthTotal.toLocaleString()}</p>
                    <p className="text-xs font-bold text-gray-400 mt-2">{thisMonthDisbursements.length} disbursements this month</p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs text-emerald-600 font-bold">
                        {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Card 3: Pending Amount */}
            <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2">Pending Amount</p>
                    <p className="text-2xl font-black text-amber-900">UGX {pendingAmount.toLocaleString()}</p>
                    <p className="text-xs font-bold text-amber-600 mt-2">{confirmedTransactions.length} transactions pending</p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <p className="text-xs text-amber-700 font-bold">
                        Processing within 4 hours
                    </p>
                </div>
            </div>
          </div>

          {/* Pending Disbursements Section */}
          {confirmedTransactions.length > 0 && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex items-start justify-between">
                  <div>
                      <h3 className="text-lg font-black text-gray-900">Pending Disbursements</h3>
                      <div className="flex items-center gap-2 mt-2 text-amber-600">
                          <Info className="w-4 h-4" />
                          <p className="text-xs font-bold">Payments for confirmed transactions are processed within 4 hours</p>
                      </div>
                  </div>
                  <div className="bg-amber-50 px-3 py-1 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-widest">
                      {confirmedTransactions.length} Pending
                  </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount (UGX)</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Items</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {confirmedTransactions.map((txn, idx) => (
                      <tr key={txn.id || idx} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-8 py-6">
                            <p className="text-sm font-bold text-gray-900">{new Date(txn.confirmed_at || txn.transacted_at).toLocaleDateString()}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(txn.confirmed_at || txn.transacted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-8 py-6">
                            <p className="text-sm font-black text-gray-900">UGX {(txn.total_amount || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                            <p className="text-sm font-bold text-gray-600 max-w-xs truncate">{txn.items_description || 'School supplies'}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                Pending Settlement
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment History - Completed Disbursements */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900">Payment History</h3>
                <div className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {filteredDisbursements.length} of {disbursements.length}
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search MoMo Ref or TxnID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Date From */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="From Date"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                {/* Date To */}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="To Date"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {(searchQuery || statusFilter !== 'all' || dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="mt-4 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {filteredDisbursements.length === 0 ? (
              <div className="py-16 px-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-500">
                  {disbursements.length === 0 ? 'No completed disbursements yet' : 'No disbursements match your filters'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {disbursements.length === 0 ? 'Confirmed transactions will be disbursed within 4 hours' : 'Try adjusting your search or filter criteria'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date & Time</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount (UGX)</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">MoMo Reference</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction ID</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedDisbursements.map((d, idx) => (
                      <tr key={d.transaction_id || idx} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-8 py-6">
                            <p className="text-sm font-bold text-gray-900">{new Date(d.disbursed_at).toLocaleDateString()}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(d.disbursed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-8 py-6">
                            <p className="text-sm font-black text-gray-900">UGX {(d.amount || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-6">
                            {d.momo_reference ? (
                              <div className="flex items-center gap-2">
                                  <div className="p-2 bg-emerald-50 rounded-lg">
                                      <ExternalLink className="w-3 h-3 text-emerald-600" />
                                  </div>
                                  <p className="text-sm font-black text-gray-900 font-mono tracking-tight">{d.momo_reference}</p>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-gray-400 italic">Processing...</span>
                            )}
                        </td>
                        <td className="px-8 py-6">
                            <p className="text-xs text-gray-400 font-mono">{d.transaction_id?.substring(0, 8) || 'N/A'}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              d.payment_status === 'completed' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : d.payment_status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                                {d.payment_status === 'completed' && <ShieldCheck className="w-3 h-3" />}
                                {d.payment_status === 'pending' && <Clock className="w-3 h-3" />}
                                {d.payment_status === 'completed' ? 'Completed' : d.payment_status === 'pending' ? 'Processing' : d.payment_status || 'Unknown'}
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {filteredDisbursements.length > itemsPerPage && (
              <div className="px-8 py-6 border-t border-gray-50 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDisbursements.length)} of {filteredDisbursements.length} disbursements
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Help Section */}
      <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-amber-200/50 rounded-3xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <div>
                <h4 className="text-lg font-black text-amber-900">Need help with disbursements?</h4>
                <p className="text-sm text-amber-700 font-medium max-w-md">Settlements are processed every 4 hours. Contact support if you have questions about your payments.</p>
            </div>
         </div>
         <button 
           onClick={handleContactSupport}
           className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-amber-600/20 whitespace-nowrap active:scale-95"
         >
            Contact Support
         </button>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSupportModal(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Contact Support</h3>
                <p className="text-sm text-gray-500 mt-1">Get help with your disbursements</p>
              </div>
              <button onClick={() => setShowSupportModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Account Summary</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Merchant</p>
                    <p className="text-sm font-bold text-gray-900">Amadile Hub</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Settled</p>
                    <p className="text-sm font-bold text-gray-900">UGX {totalDisbursed.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pending Amount</p>
                    <p className="text-sm font-bold text-amber-600">UGX {pendingAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pending Transactions</p>
                    <p className="text-sm font-bold text-amber-600">{confirmedTransactions.length}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700">Contact Options:</p>
                
                <button
                  onClick={handleCopyDetails}
                  className="w-full flex items-center gap-3 p-4 border-2 border-amber-500 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all group"
                >
                  <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-all">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-900">{copied ? '✓ Copied!' : 'Copy Support Details'}</p>
                    <p className="text-xs text-gray-500">Paste into your email or messaging app</p>
                  </div>
                </button>

                <a 
                  href={`mailto:support@edubridge.ug?subject=${encodeURIComponent('Disbursement Support - Amadile Hub')}&body=${encodeURIComponent(
                    `Hello EduBridge Support,\n\nI need assistance with my disbursements.\n\nMerchant: Amadile Hub\nTotal Settled: UGX ${totalDisbursed.toLocaleString()}\nPending Amount: UGX ${pendingAmount.toLocaleString()}\nPending Transactions: ${confirmedTransactions.length}\n\nIssue Description:\n[Please describe your issue here]\n\nThank you.`
                  )}`}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all group"
                >
                  <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-all">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Open Email Client</p>
                    <p className="text-xs text-gray-500">support@edubridge.ug</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>

                <a 
                  href="tel:+256800123456"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all group"
                >
                  <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-all">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Call Support</p>
                    <p className="text-xs text-gray-500">+256 800 123 456 (Toll-free)</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>

                <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Support Hours</p>
                    <p className="text-xs text-gray-500">Monday - Friday: 8:00 AM - 6:00 PM EAT</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disbursements;

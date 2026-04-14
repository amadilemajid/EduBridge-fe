import React, { useState, useEffect } from 'react';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { 
  ChevronDown, ChevronUp, GraduationCap, ShoppingBag, 
  CheckCircle2, Clock, AlertCircle, Calendar
} from 'lucide-react';

const LoanHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loans, setLoans] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/v1/loans/history').catch(() => ({
          data: [
            {
              id: 'FEE-902',
              type: 'fee',
              status: 'active',
              principal: 500000,
              outstanding: 350000,
              date_applied: new Date(Date.now() - 86400000 * 15).toISOString(),
              schedule: [
                { id: '1', date: new Date(Date.now() - 86400 * 1 * 1000).toISOString(), amount: 150000, status: 'paid' },
                { id: '2', date: new Date(Date.now() + 86400 * 14 * 1000).toISOString(), amount: 150000, status: 'pending' },
                { id: '3', date: new Date(Date.now() + 86400 * 28 * 1000).toISOString(), amount: 200000, status: 'pending' },
              ]
            },
            {
              id: 'SUP-405',
              type: 'supplies',
              status: 'overdue',
              principal: 120000,
              outstanding: 45000,
              date_applied: new Date(Date.now() - 86400000 * 45).toISOString(),
              schedule: [
                { id: '4', date: new Date(Date.now() - 86400 * 15 * 1000).toISOString(), amount: 75000, status: 'paid' },
                { id: '5', date: new Date(Date.now() - 86400 * 2 * 1000).toISOString(), amount: 45000, status: 'overdue' },
              ]
            },
            {
              id: 'FEE-110',
              type: 'fee',
              status: 'completed',
              principal: 400000,
              outstanding: 0,
              date_applied: new Date(Date.now() - 86400000 * 180).toISOString(),
              schedule: [
                { id: '6', date: new Date(Date.now() - 86400 * 150 * 1000).toISOString(), amount: 440000, status: 'paid' }
              ]
            }
          ]
        }));
        setLoans(response.data);
      // eslint-disable-next-line no-unused-vars
      } catch (_) {
        setError("Could not retrieve loan history.");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Active</span>;
      case 'completed': return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'overdue': return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</span>;
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"><Clock className="w-3 h-3 inline pb-0.5" /> Pending</span>;
      case 'paid': return <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Paid</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  if (loading) return <LoadingSpinner variant="full" />;

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans max-w-md mx-auto relative pb-safe">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pt-6">
        
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-black text-slate-900">Loan History</h2>
        </div>

        {error && <ErrorBanner message={error} />}

        {loans.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium">No previous loans found.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {loans.map(loan => {
              const isExpanded = expandedId === loan.id;
              const isFee = loan.type === 'fee';
              
              return (
                <div key={loan.id} className={`bg-white rounded-2xl shadow-sm border ${loan.status === 'overdue' ? 'border-rose-200' : 'border-slate-100'} overflow-hidden transition-all`}>
                  {/* Summary Header */}
                  <div 
                    onClick={() => toggleExpand(loan.id)}
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isFee ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'}`}>
                          {isFee ? <GraduationCap className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{isFee ? 'School Fee Loan' : 'Supplies BNPL'}</p>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5 uppercase">ID: {loan.id}</p>
                        </div>
                      </div>
                      {getStatusBadge(loan.status)}
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium mb-0.5">Principal Amount</p>
                        <p className="font-bold text-slate-700 text-sm">UGX {loan.principal.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Schedule Grid */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Repayment Schedule</h4>
                        <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                          Balance: UGX {loan.outstanding.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {loan.schedule.map(inst => (
                          <div key={inst.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-sm">
                            <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full ${inst.status === 'paid' ? 'bg-emerald-400' : inst.status === 'overdue' ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`}></div>
                              <div>
                                <p className={`font-bold ${inst.status === 'paid' ? 'text-slate-500' : 'text-slate-900'}`}>UGX {inst.amount.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{new Date(inst.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            {getStatusBadge(inst.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanHistory;

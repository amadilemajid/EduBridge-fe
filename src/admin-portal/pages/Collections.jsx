import React, { useState } from 'react';
import useSWR from 'swr';
import { Phone, Users as FieldAgent, FileText as FileLegal, ChevronDown, ChevronRight, Activity } from 'lucide-react';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import SuccessToast from '../../shared/components/SuccessToast';

const fetcher = url => apiClient.get(url).then(res => {
  const d = res?.data ?? res;
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.applications)) return d.applications;
    if (Array.isArray(d.users)) return d.users;
    if (Array.isArray(d.collections)) return d.collections;
    return d; // For object responses like portfolio
  }
  return [];
});

const STAGES = [
  { id: 1, name: 'Stage 1: Day 1–6 (SMS Sent)', min: 1, max: 6, actionLabel: 'Log Call Attempt', icon: Phone, color: 'text-amber-600', bg: 'bg-amber-100', btn: 'bg-amber-600 hover:bg-amber-700' },
  { id: 2, name: 'Stage 2: Day 7–20 (Call Flag Raised)', min: 7, max: 20, actionLabel: 'Assign Field Agent', icon: FieldAgent, color: 'text-orange-600', bg: 'bg-orange-100', btn: 'bg-orange-600 hover:bg-orange-700' },
  { id: 3, name: 'Stage 3: Day 21–59 (Field Agent Assigned)', min: 21, max: 59, actionLabel: 'Generate Legal Notice', icon: FileLegal, color: 'text-red-500', bg: 'bg-red-100', btn: 'bg-red-600 hover:bg-red-700' },
  { id: 4, name: 'Stage 4: Day 60+ (Legal Notice Stage)', min: 60, max: 9999, actionLabel: 'Log Court Action', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100', btn: 'bg-purple-600 hover:bg-purple-700' }
];

const maskPhone = (phone) => {
  if (!phone || phone.length < 10) return phone;
  const start = phone.substring(0, 6); // +25670
  const end = phone.substring(phone.length - 2);
  return `${start}***${end}`;
};

const Collections = () => {
  
  const [toast, setToast] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [expandedStages, setExpandedStages] = useState({ 1: true, 2: true, 3: true, 4: true });
  const [actingOn, setActingOn] = useState(null);

  const { data: collectionsData, error, isLoading, mutate } = useSWR('/api/v1/admin/collections', fetcher);
  const loans = collectionsData || [];
  const loading = isLoading && !collectionsData;

  const toggleStage = (id) => {
    setExpandedStages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAction = async (loan, stageAction) => {
    setActingOn(loan.id);
    setActionError(null);
    try {
      await apiClient.post(`/api/v1/admin/collections/${loan.id}/action`, { action: stageAction });
      setToast(`Successfully recorded: ${stageAction} for ${loan.borrower || loan.full_name}`);
      mutate();
    } catch (err) {
      setActionError(err.message || 'Action failed to record.');
    } finally {
      setActingOn(null);
    }
  };

  const groupedLoans = STAGES.map(stage => {
    const stageLoans = (Array.isArray(loans) ? loans : []).filter(l => {
      const days = l.daysOverdue !== undefined ? l.daysOverdue : l.days_overdue;
      return days >= stage.min && days <= stage.max;
    });
    return {
      ...stage,
      loans: stageLoans,
      count: stageLoans.length,
      totalAmout: stageLoans.reduce((acc, curr) => acc + (curr.amount || curr.outstanding || 0), 0)
    };
  });

  if (loading) return <LoadingSpinner variant="full" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <SuccessToast message={toast} visible={!!toast} onClose={() => setToast(null)} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collections Workflow</h2>
          <p className="text-gray-500 mt-1">Systematic follow-up stages for all overdue loans</p>
        </div>
      </div>

      {(error || actionError) && <ErrorBanner message={actionError || 'Failed to load collections.'} onRetry={() => mutate()} />}

      {loans.length === 0 && !error ? (
        <div className="bg-green-50 rounded-xl p-12 text-center border border-green-200">
          <Activity className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-green-800">No Overdue Loans</h3>
          <p className="text-green-600 mt-2">The portfolio is performing perfectly. There are no active collections cases.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedLoans.map((stage) => (
            <div key={stage.id} className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Stage Header */}
              <button 
                onClick={() => toggleStage(stage.id)}
                className={`w-full flex items-center justify-between p-5 transition-colors focus:outline-none ${expandedStages[stage.id] ? 'bg-gray-50 border-b border-gray-200' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stage.bg} ${stage.color}`}>
                    <stage.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-900">{stage.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {stage.count} Case{stage.count !== 1 ? 's' : ''} • Total at Risk: UGX {stage.totalAmout.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-gray-400">
                  {expandedStages[stage.id] ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </div>
              </button>

              {/* Stage Table */}
              {expandedStages[stage.id] && (
                <div className="overflow-x-auto">
                  {stage.loans.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-400 font-medium">No loans currently in this stage.</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Borrower</th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Overdue Details</th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status & Next Action</th>
                          <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {stage.loans.map((loan) => (
                          <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{loan.borrower || loan.full_name}</div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">{maskPhone(loan.phone || loan.phone_number)}</div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">UGX {(loan.amount || loan.outstanding || 0).toLocaleString()}</div>
                              <div className="text-xs font-semibold text-red-600 mt-0.5">{(loan.daysOverdue !== undefined ? loan.daysOverdue : loan.days_overdue)} Days Overdue</div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="text-sm text-gray-700 truncate max-w-xs" title={loan.lastAction}>
                                <span className="font-semibold text-gray-500 mr-1">Last:</span> {loan.lastAction}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                <span className="font-semibold">Due:</span> {new Date(loan.nextActionDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => handleAction(loan, stage.actionLabel)}
                                disabled={actingOn === loan.id}
                                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm transition-all ${
                                  actingOn === loan.id ? 'opacity-50 cursor-not-allowed bg-gray-400' : stage.btn
                                }`}
                              >
                                {actingOn === loan.id ? 'Recording...' : stage.actionLabel}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collections;

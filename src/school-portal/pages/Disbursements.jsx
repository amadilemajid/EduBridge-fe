import React from "react";
import useSWR from 'swr';
import apiClient from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import EmptyState from '../../shared/components/EmptyState';

const Disbursements = () => {
  const { currentUser } = useAuth();
    const fetcher = url => apiClient.get(url).then(res => res?.data?.disbursements || res?.data || res);
  const { data: disbData, error, isLoading } = useSWR(schoolId ? `/api/v1/schools/${schoolId}/disbursements` : null, fetcher);
  const disbursements = Array.isArray(disbData) ? disbData : [];
  const loading = isLoading && !disbData;
  const errorObj = error?.message || null;

  const schoolId = currentUser?.school_id || currentUser?.id;



  if (loading) return <LoadingSpinner variant="full" />;
  if (errorObj) return <ErrorBanner message={errorObj} />;

  const totalReceived = disbursements.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Disbursements History</h2>
          <p className="text-sm text-gray-500 mt-1">Record of all cleared fee transfers via mobile money.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide">Total Received This Term</p>
          <p className="text-3xl font-black text-gray-900">UGX {totalReceived.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {disbursements.length === 0 ? (
          <EmptyState message="Your school has not received any disbursements yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (UGX)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MoMo Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {disbursements.map((tx, idx) => (
                  <tr key={tx.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.disbursed_at ? new Date(tx.disbursed_at).toLocaleDateString() : 'Pending'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tx.student_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {(tx.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                      {tx.reference || tx.receipt_number || 'PENDING'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {tx.status || 'Settled'}
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

export default Disbursements;

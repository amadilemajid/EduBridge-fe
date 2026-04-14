import React, { useState } from 'react';
import useSWR from 'swr';
import apiClient from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import EmptyState from '../../shared/components/EmptyState';
import { Users, Wallet, UserCheck, Calendar, Search, Download, TrendingUp, AlertCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();

  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleExportExcel = () => {
    const studentsArray = studentsData?.students || studentsData;
    if (!studentsArray || studentsArray.length === 0) return;
    
    // Create CSV header line
    const headers = ['Student Name', 'Class', 'Fee Amount (UGX)', 'Disbursement Date', 'Status'];
    
    // Process rows
    const csvRows = studentsArray.map(s => {
      const name = s.name || s.student_name || 'N/A';
      const studentClass = s.class || 'N/A';
      const amount = s.loan_amount || s.fee_amount || 0;
      const date = s.disbursed_at ? new Date(s.disbursed_at).toLocaleDateString() : 'Pending';
      const status = s.status || s.loan_status || s.application_status || 'Active';
      return `"${name}","${studentClass}","${amount}","${date}","${status}"`;
    });
    
    // Combine into CSV string
    const csvString = [headers.join(','), ...csvRows].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'EduBridge_Funded_Students.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const schoolId = currentUser?.school_id || currentUser?.id;
  
  const fetcher = url => apiClient.get(url).then(res => res?.data?.data || res?.data || res);
  // Replaced states correctly
  
  const { data: studentsData, error: stdError, isLoading: stdLoading } = useSWR(schoolId ? `/api/v1/schools/${schoolId}/students` : null, fetcher);
  const { data: disburseData, error: disbError, isLoading: disbLoading } = useSWR(schoolId ? `/api/v1/schools/${schoolId}/disbursements` : null, fetcher);

  const studentsArray = studentsData?.students || studentsData;
  const disburseArray = disburseData?.disbursements || disburseData;
  
  const students = Array.isArray(studentsArray) ? studentsArray : [];
  const disbursements = Array.isArray(disburseArray) ? disburseArray : [];

  const loading = (stdLoading && !studentsData) || (disbLoading && !disburseData);
  const errorObj = (stdError || disbError)?.message || null;

  if (loading) return <LoadingSpinner variant="full" />;
  if (errorObj) return <ErrorBanner message={errorObj} />;

  // Calculate top cards
  const totalStudents = students.length;
  const totalFeesReceived = disbursements.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const pendingConfirmations = students.filter(s => s.status === 'pending_confirmation').length;
  
  // Find last disbursement
  let lastDisbursement = null;
  if (disbursements.length > 0) {
    const sortedD = [...disbursements].sort((a, b) => new Date(b.disbursed_at || b.created_at) - new Date(a.disbursed_at || a.created_at));
    lastDisbursement = sortedD[0];
  }

  // Filter students
  const filteredStudents = students.filter(s => {
    const name = (s.name || s.student_name || '').toLowerCase();
    const parent = (s.parent_name || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || parent.includes(searchTerm.toLowerCase());
    const matchesClass = filterClass ? s.class === filterClass : true;
    const matchesTerm = filterTerm ? s.term_name === filterTerm : true;
    return matchesSearch && matchesClass && matchesTerm;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Current term metrics and funded students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Students */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between relative overflow-hidden group">
          <div className="z-10">
            <p className="text-sm font-medium text-gray-500">Funded Students</p>
            <p className="mt-2 text-3xl font-black text-gray-900">{totalStudents}</p>
            <div className="mt-3 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full w-fit">
              <TrendingUp className="w-3 h-4" />
              <span className="text-[10px] font-bold">+12% from last term</span>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Card 2: Fees */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between relative overflow-hidden group">
          <div className="z-10">
            <p className="text-sm font-medium text-gray-500">Total Fees Received</p>
            <p className="mt-2 text-3xl font-black text-gray-900 leading-none">
              <span className="text-sm font-bold text-gray-400 block mb-1">UGX</span>
              {totalFeesReceived.toLocaleString()}
            </p>
            <div className="mt-3 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full w-fit">
              <TrendingUp className="w-3 h-4" />
              <span className="text-[10px] font-bold">Target: 45M</span>
            </div>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg group-hover:bg-emerald-100 transition-colors">
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Card 3: Confirmations */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between relative overflow-hidden group">
          <div className="z-10">
            <p className="text-sm font-medium text-gray-500">Pending Confirmations</p>
            <p className="mt-2 text-3xl font-black text-gray-900">{pendingConfirmations}</p>
            <div className="mt-3 flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full w-fit">
              <AlertCircle className="w-3 h-4" />
              <span className="text-[10px] font-bold">Action Required</span>
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg group-hover:bg-orange-100 transition-colors">
            <UserCheck className="w-6 h-6 text-orange-600" />
          </div>
        </div>

        {/* Card 4: Disbursements */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between relative overflow-hidden group">
          <div className="z-10">
            <p className="text-sm font-medium text-gray-500">Last Disbursement</p>
            {lastDisbursement ? (
              <>
                <p className="mt-2 text-2xl font-black text-gray-900 leading-none">
                  <span className="text-sm font-bold text-gray-400 block mb-1">UGX</span>
                  {Number(lastDisbursement.amount).toLocaleString()}
                </p>
                <div className="mt-3 flex items-center gap-1.5 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full w-fit">
                  <Clock className="w-3 h-4" />
                  <span className="text-[10px] font-bold">
                    {new Date(lastDisbursement.disbursed_at || lastDisbursement.created_at).toLocaleDateString()}
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-xl font-semibold text-gray-400">N/A</p>
            )}
          </div>
          <div className="bg-purple-50 p-3 rounded-lg group-hover:bg-purple-100 transition-colors">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-gray-900 whitespace-nowrap">EduBridge Funded Students</h3>
          
          <div className="flex flex-wrap items-center gap-4 flex-1 justify-end">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 box-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <select 
                  className="block pl-3 pr-10 py-2 text-sm border-gray-200 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-lg bg-white border"
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                >
                  <option value="">All Terms</option>
                  {[...new Set(students.map(s => s.term_name).filter(Boolean))].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
              </select>
               <select 
                  className="block pl-3 pr-10 py-2 text-sm border-gray-200 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-lg bg-white border"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {[...new Set(students.map(s => s.class).filter(Boolean))].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
              </select>
            </div>

            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-sm transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <EmptyState message="No students found matching the criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disbursement Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.application_id || idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm font-bold text-gray-900">{student.student_name || 'N/A'}</div>
                       <div className="text-[10px] text-gray-400 font-medium">PARENT: {student.parent_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">UGX {Number(student.loan_amount || student.fee_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.disbursed_at ? new Date(student.disbursed_at).toLocaleDateString() : 'Pending'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (student.status || student.loan_status || student.application_status) === 'funded' || (student.status || student.loan_status || student.application_status) === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {student.status || student.loan_status || student.application_status || 'Active'}
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

import React, { useEffect, useState } from 'react';
import apiClient from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';

const Profile = () => {
  const { currentUser } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const schoolId = currentUser?.school_id || currentUser?.id;

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    const fetchSchool = async () => {
      try {
        const resp = await apiClient.get(`/api/v1/schools/${schoolId}`);
        setSchool(resp.data?.school || resp.data);
      } catch (err) {
        setError(err.message || 'Failed to load school profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchool();
  }, [schoolId]);

  if (loading) return <LoadingSpinner variant="full" />;
  if (error) return <ErrorBanner message={error} />;
  if (!school) return <div className="p-8 text-center text-gray-500">School profile not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-emerald-600 relative">
          <div className="absolute -bottom-12 left-8 h-24 w-24 bg-white rounded-2xl shadow-md border-4 border-white flex items-center justify-center overflow-hidden">
            <div className="text-4xl text-emerald-600 font-black">{school.name?.charAt(0) || 'S'}</div>
          </div>
        </div>
        <div className="pt-16 pb-8 px-8">
          <h1 className="text-3xl font-black text-gray-900">{school.name}</h1>
          <p className="text-gray-500 font-medium">School Code: <span className="text-emerald-600 font-bold">{school.school_code || 'PENDING'}</span></p>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Registration Info</h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 italic">MoES Registration Number</p>
                <p className="text-gray-900 font-semibold">{school.registration_number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 italic">TIN Number</p>
                <p className="text-gray-900 font-semibold">{school.tin || 'N/A'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Contact Details</h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 italic">Contact Phone</p>
                <p className="text-gray-900 font-semibold">{school.contact_phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 italic">District / Location</p>
                <p className="text-gray-900 font-semibold">{school.district}, {school.address || 'Central'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="bg-amber-500 text-white rounded-full p-1.5 mt-0.5">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div>
          <h4 className="font-bold text-amber-900 text-sm italic">Verification Status: {school.verification_status?.toUpperCase()}</h4>
          <p className="text-amber-800 text-xs mt-1">Your school is currently in {school.verification_status} status. Please ensure all documents are up to date with EduBridge compliance team.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;

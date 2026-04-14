import React, { useState } from 'react';
import { useAuth } from '../../shared/auth/AuthContext';
import { LogOut, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('children');
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/parent/login');
  };

  const [children, setChildren] = useState([
    { id: 1, name: 'Alice Namaganda', school: 'Kampala Parents School', grade: 'P.4' },
    { id: 2, name: 'John Mukasa', school: 'Makerere College School', grade: 'S.2' },
  ]);

  const [pinData, setPinData] = useState({ current: '', new: '', confirm: '' });
  const [prefs, setPrefs] = useState({ sms: true, email: false });

  const handleAddChild = () => {
    const newChild = { id: Date.now(), name: 'New Enrolled Student', school: 'EduBridge Partner School', grade: 'P.1' };
    setChildren([...children, newChild]);
    showToast('Student linked successfully!', 'success');
  };

  const handleEditChild = (id) => {
    setChildren(children.map(c => c.id === id ? { ...c, grade: 'Updated Grade' } : c));
    showToast('Child details updated successfully.', 'success');
  };

  const handleUpdatePin = () => {
    if (!pinData.current || !pinData.new || !pinData.confirm) {
      return showToast('All PIN fields are required.', 'error');
    }
    if (pinData.new !== pinData.confirm) {
      return showToast('New PIN and Confirm PIN do not match.', 'error');
    }
    showToast('PIN updated securely.', 'success');
    setPinData({ current: '', new: '', confirm: '' });
  };

  const handleSavePrefs = () => {
    showToast('Notification preferences saved successfully.', 'success');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Parent Profile</h2>
          <p className="text-gray-500">Manage your account and children's details</p>
        </div>
      </div>
      
      {/* Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center shrink-0">
          <User className="w-12 h-12" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-gray-900">{currentUser?.full_name || 'Parent User'}</h3>
          <p className="text-gray-500 text-lg mb-2">{currentUser?.phone_number || '+256 --- --- ---'}</p>
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
            KYC Verified
          </span>
        </div>
        <div className="w-full md:w-auto">
          <button 
            onClick={handleLogout}
            className="w-full md:w-auto px-6 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Dynamic Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('children')}
            className={`px-6 py-4 font-semibold text-sm md:text-base whitespace-nowrap transition-colors ${activeTab === 'children' ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            My Children
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-6 py-4 font-semibold text-sm md:text-base whitespace-nowrap transition-colors ${activeTab === 'security' ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Security & PIN
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`px-6 py-4 font-semibold text-sm md:text-base whitespace-nowrap transition-colors ${activeTab === 'preferences' ? 'text-sky-600 border-b-2 border-sky-600 bg-sky-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Notification Preferences
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'children' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-gray-900">Linked Children</h4>
                <button 
                   onClick={handleAddChild}
                   className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-bold hover:bg-sky-700 transition"
                >
                  + Add Child
                </button>
              </div>
              {children.map(child => (
                <div key={child.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-sky-300 hover:shadow-sm transition-all">
                  <div>
                    <h5 className="font-bold text-gray-900">{child.name}</h5>
                    <p className="text-gray-500 text-sm">{child.school} &bull; {child.grade}</p>
                  </div>
                  <button 
                    onClick={() => handleEditChild(child.id)}
                    className="text-sky-600 font-medium text-sm hover:underline"
                  >
                     Edit
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Change PIN</h4>
                <div className="space-y-3">
                  <input 
                    type="password" 
                    placeholder="Current PIN" 
                    value={pinData.current}
                    onChange={(e) => setPinData({...pinData, current: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none" 
                  />
                  <input 
                    type="password" 
                    placeholder="New 4-Digit PIN" 
                    value={pinData.new}
                    onChange={(e) => setPinData({...pinData, new: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none" 
                  />
                  <input 
                    type="password" 
                    placeholder="Confirm New PIN" 
                    value={pinData.confirm}
                    onChange={(e) => setPinData({...pinData, confirm: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none" 
                  />
                  <button 
                    onClick={handleUpdatePin}
                    className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl mt-2 hover:bg-gray-800 transition"
                  >
                    Update PIN
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-gray-900">Alert Settings</h4>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={prefs.sms} 
                    onChange={(e) => setPrefs({...prefs, sms: e.target.checked})}
                    className="w-5 h-5 text-sky-600 rounded border-gray-300 focus:ring-sky-500" 
                  />
                  <div>
                    <p className="font-semibold text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Receive OTPs and loan status updates via SMS.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={prefs.email} 
                    onChange={(e) => setPrefs({...prefs, email: e.target.checked})}
                    className="w-5 h-5 text-sky-600 rounded border-gray-300 focus:ring-sky-500" 
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Email Newsletters</p>
                    <p className="text-sm text-gray-500">Get updates about EduBridge features and partner schools.</p>
                  </div>
                </label>
                <button 
                   onClick={handleSavePrefs}
                   className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl mt-4 hover:bg-gray-800 transition"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Toast rendering */}
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 shadow-xl rounded-xl p-4 flex items-center gap-3 w-80 max-w-full border ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
        }`}>
          {toast.type === 'success' 
            ? <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" /> 
            : <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          }
          <p className={`text-sm font-medium flex-1 ${toast.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
            {toast.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile;

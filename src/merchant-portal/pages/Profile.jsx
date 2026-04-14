import React, { useRef, useState } from 'react';
import useSWR from 'swr';
import { 
  Store, 
  MapPin, 
  PhoneCall, 
  Mail, 
  ShieldCheck, 
  Wallet, 
  FileText, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  X,
  MessageSquare,
  Building2
} from 'lucide-react';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';

const Profile = () => {
  const fetcher = url => apiClient.get(url).then(res => res?.data?.data || res?.data || res);
  const { data: profile, error: profError, isLoading: profLoading } = useSWR('/api/v1/merchant/profile', fetcher);
  const loading = profLoading && !profile;
  const error = profError?.message || null;
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('documents', files[i]);
      }

      const response = await apiClient.post('/api/v1/merchant/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert(response.data.message || "Documents uploaded successfully! Our compliance team will review them within 24-48 hours.");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to upload documents. Please try again.';
      setUploadError(errorMsg);
      alert(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) return <LoadingSpinner variant="full" />;

  const isVerified = profile?.is_verified;
  const verificationStatus = profile?.verification_status || 'pending';

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans tracking-tight">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">Shop Profile</h2>
          <p className="text-gray-500 font-medium mt-1">Manage your business profile and compliance details.</p>
        </div>
        {isVerified ? (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-sm tracking-wide">Fully Verified Partner</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-2xl border border-amber-100 shadow-sm">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-sm tracking-wide">Verification {verificationStatus}</span>
          </div>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {!isVerified && !error && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] flex flex-col md:flex-row gap-6 md:items-center justify-between shadow-sm">
           <div className="flex gap-4 items-start md:items-center">
             <div className="bg-amber-100 p-3 rounded-xl shrink-0">
               <AlertTriangle className="w-6 h-6 text-amber-600" />
             </div>
             <div>
               <h4 className="font-black text-amber-900 text-lg">Action Required</h4>
               <p className="text-amber-800 text-sm mt-1 max-w-2xl font-medium">Your account is currently under review by the physical compliance team. You will be able to process BNPL purchases once your shop and identity are fully verified.</p>
             </div>
           </div>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             className="hidden" 
             multiple 
             accept=".pdf,.png,.jpg,.jpeg"
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             disabled={uploading}
             className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-amber-600/20 whitespace-nowrap active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {uploading ? 'Uploading...' : 'Upload Documents'}
           </button>
        </div>
      )}

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Store className="w-48 h-48 rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110 duration-500" />
               </div>
               
               <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-6">
                       <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center border border-amber-100/50 shadow-inner">
                            <span className="text-3xl font-black text-amber-600 uppercase">
                                {profile.name ? profile.name.substring(0,2) : 'SP'}
                            </span>
                       </div>
                       <div>
                           <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{profile.name}</h3>
                           <p className="text-amber-600 font-bold text-sm mt-1 flex items-center gap-1.5 uppercase tracking-widest"><Store className="w-4 h-4" /> {profile.category || 'Retail Shop'}</p>
                       </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                      <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl">
                          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
                              <MapPin className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1.5">Location</p>
                              <p className="font-bold text-gray-900 text-sm">{profile.location}{profile.district ? `, ${profile.district}` : ''}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl">
                          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100">
                              <User className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1.5">Shop Owner</p>
                              <p className="font-bold text-gray-900 text-sm">{profile.owner_name}</p>
                          </div>
                      </div>
                   </div>
               </div>
            </div>

            {/* Compliance Info */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50">
                    <h4 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-gray-400" /> 
                        Tax & Compliance
                    </h4>
                    {isVerified && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Tax Identification Number (TIN)</p>
                        <p className="font-bold text-gray-900 bg-gray-50 p-4 rounded-2xl border border-gray-100 uppercase font-mono tracking-widest text-center shadow-inner">
                            {profile.tin}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Platform Join Date</p>
                        <p className="font-bold text-gray-900 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center shadow-inner">
                            {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'})}
                        </p>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column sidebar */}
          <div className="space-y-8">
              {/* Payment Info */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                      <Wallet className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                      <h4 className="text-lg font-black text-white flex items-center gap-2 mb-6">
                         Settlement Payouts
                      </h4>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Mobile Money Route</p>
                      
                      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 mb-4 backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${profile.momo_provider === 'MTN' ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                              <div>
                                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-0.5">{profile.momo_provider} Mobile Money</p>
                                  <p className="font-mono text-lg font-black tracking-widest text-white">{profile.momo_number}</p>
                              </div>
                          </div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          All BNPL sales are settled automatically to this wallet every 4 hours.
                      </p>
                  </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h4 className="text-lg font-black text-gray-900 mb-6 pb-4 border-b border-gray-50">Support & Contact</h4>
                  <div className="space-y-5">
                      <div className="flex items-start gap-4">
                          <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 shrink-0">
                              <PhoneCall className="w-4 h-4" />
                          </div>
                          <div>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Registered Phone</p>
                              <p className="text-sm font-bold text-gray-900 font-mono tracking-tight">{profile.contact_phone}</p>
                          </div>
                      </div>
                      {profile.contact_email && (
                          <div className="flex items-start gap-4">
                              <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0">
                                  <Mail className="w-4 h-4" />
                              </div>
                              <div>
                                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Registered Email</p>
                                  <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{profile.contact_email}</p>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Read Only Notice */}
              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-start gap-4 flex-col text-center">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mx-auto">
                     <HelpCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="w-full">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Need to update details?</h4>
                      <p className="text-xs text-gray-500 font-medium px-2 leading-relaxed">For compliance and security reasons, critical profile and payout details cannot be changed from the dashboard.</p>
                      <button 
                          onClick={() => setShowSupportModal(true)}
                          className="mt-4 w-full py-3 bg-white border border-gray-200 hover:border-amber-200 hover:text-amber-600 text-gray-700 font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 text-sm font-sans"
                      >
                          Contact EduBridge Support <MessageSquare className="w-3 h-3" />
                      </button>
                  </div>
              </div>
          </div>
        </div>
      )}

      {/* Contact Support Modal */}
      {showSupportModal && profile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-[2rem] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 p-3 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Contact EduBridge Support</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Get help with your merchant account</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSupportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Account Summary */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <Building2 className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-amber-600 tracking-widest mb-2">Your Account</p>
                    <h4 className="text-lg font-black text-gray-900 mb-1">{profile.name}</h4>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Shop ID</p>
                        <p className="text-xs font-mono font-bold text-gray-700 mt-0.5">{profile.shop_id?.substring(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TIN</p>
                        <p className="text-xs font-mono font-bold text-gray-700 mt-0.5">{profile.tin}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Methods */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Contact Methods</h4>
                
                {/* Email */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-amber-200 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Email Support</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">support@edubridge.co.ug</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard('support@edubridge.co.ug', 'email')}
                        className="p-2 hover:bg-white rounded-xl transition-colors"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <a
                        href={`mailto:support@edubridge.co.ug?subject=Support%20Request%20-%20${encodeURIComponent(profile.name)}&body=Shop%20ID:%20${profile.shop_id}%0D%0ATIN:%20${profile.tin}%0D%0A%0D%0APlease%20describe%20your%20issue:%0D%0A`}
                        className="p-2 hover:bg-white rounded-xl transition-colors"
                        title="Send email"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-amber-200 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                        <PhoneCall className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Phone Support</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5 font-mono">+256 800 123 456</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">Mon-Fri, 8AM-6PM EAT</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard('+256800123456', 'phone')}
                        className="p-2 hover:bg-white rounded-xl transition-colors"
                        title="Copy phone"
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <a
                        href="tel:+256800123456"
                        className="p-2 hover:bg-white rounded-xl transition-colors"
                        title="Call now"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-amber-200 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">WhatsApp Support</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5 font-mono">+256 700 123 456</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-1">Quick responses, 24/7</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard('+256700123456', 'whatsapp')}
                        className="p-2 hover:bg-white rounded-xl transition-colors"
                        title="Copy number"
                      >
                        {copiedField === 'whatsapp' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <a
                        href={`https://wa.me/256700123456?text=Hi%20EduBridge,%20I%20need%20help%20with%20my%20merchant%20account.%0A%0AShop:%20${encodeURIComponent(profile.name)}%0AShop%20ID:%20${profile.shop_id}%0ATIN:%20${profile.tin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white rounded-xl transition-colors"
                        title="Open WhatsApp"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const summary = `Shop: ${profile.name}\nShop ID: ${profile.shop_id}\nTIN: ${profile.tin}\nPhone: ${profile.contact_phone}\nEmail: ${profile.contact_email || 'N/A'}`;
                      copyToClipboard(summary, 'summary');
                    }}
                    className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {copiedField === 'summary' ? (
                      <><Check className="w-3 h-3" /> Copied!</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy Account Info</>
                    )}
                  </button>
                  <a
                    href="https://docs.edubridge.ug/merchant-support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-3 h-3" /> Help Center
                  </a>
                </div>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  <span className="font-black">Note:</span> For profile updates (name, TIN, payout details), please contact support with your request. Changes require verification for security and compliance.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 rounded-b-[2rem] flex justify-end">
              <button
                onClick={() => setShowSupportModal(false)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

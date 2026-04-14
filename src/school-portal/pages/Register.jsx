import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import apiClient from '../../shared/api/client';
import ErrorBanner from '../../shared/components/ErrorBanner';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isVerifyingTIN, setIsVerifyingTIN] = useState(false);
  const [tinVerified, setTinVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    tin: '',
    district: '',
    directorName: '',
    directorNin: '',
    contact_phone: '',
    contact_email: '',
    momo_number: '',
    momo_provider: 'MTN',
    pin: '',
    pin_confirm: '',
    feesMode: 'upload', // 'upload' or 'manual'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // If TIN changes, reset verification
    if (e.target.name === 'tin') {
      setTinVerified(false);
    }
  };

  const handleTINSetup = async () => {
    if (!formData.tin || formData.tin.length < 10) {
      setErrorMsg("Please enter a valid TIN before verifying.");
      return;
    }
    setErrorMsg(null);
    setIsVerifyingTIN(true);
    
    // Simulating call to URA API via EduBridge Backend or simply mock delay for UI
    setTimeout(() => {
      setIsVerifyingTIN(false);
      if (formData.tin.startsWith('000')) {
        setErrorMsg("Invalid TIN structure returned by URA.");
        setTinVerified(false);
      } else {
        setTinVerified(true);
      }
    }, 1500);
  };

  const handeNextStep = () => {
    setErrorMsg(null);
    if (step === 1 && !tinVerified) {
      setErrorMsg("You must verify your TIN before proceeding.");
      return;
    }
    if (step === 2) {
      if (formData.pin !== formData.pin_confirm) {
        setErrorMsg("PINs do not match.");
        return;
      }
      if (formData.pin.length !== 4) {
        setErrorMsg("PIN must be exactly 4 digits.");
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // POST /api/v1/schools/register
      await apiClient.post('/api/v1/schools/register', {
        name: formData.name,
        registration_number: formData.registrationNumber,
        district: formData.district,
        tin: formData.tin,
        contact_email: formData.contact_email || 'example@school.com',
        contact_phone: formData.contact_phone || '+256770000000',
        director_name: formData.directorName,
        director_nin: formData.directorNin,
        momo_number: formData.momo_number || formData.contact_phone,
        momo_provider: formData.momo_provider,
        pin: formData.pin,
      });
      setIsSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center border-t-8 border-t-emerald-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">Registration Submitted!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            EduBridge will contact you at your registered phone number to schedule a physical verification visit.
          </p>
          <button
            onClick={() => navigate('/school/login')}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 disabled">
          <h2 className="text-3xl font-extrabold text-gray-900">Partner School Registration</h2>
          <p className="mt-2 text-sm text-gray-600">Join the EduBridge network to empower your students.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {s}
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= s ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {s === 1 && 'School'}
                  {s === 2 && 'Director'}
                  {s === 3 && 'Fees'}
                  {s === 4 && 'Review'}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-2 h-1 bg-gray-200 rounded-full mx-4 -translate-y-9 -z-10">
            <div className="absolute top-0 left-0 h-full bg-emerald-600 rounded-full transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          {errorMsg && <ErrorBanner message={errorMsg} />}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">School Details</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Official School Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Certificate of Registration</label>
                  <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">District</label>
                  <select name="district" value={formData.district} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                    <option value="">Select District</option>
                    <option value="Kampala">Kampala</option>
                    <option value="Wakiso">Wakiso</option>
                    <option value="Mukono">Mukono</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Tax Identification Number (TIN)</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input type="text" name="tin" value={formData.tin} onChange={handleChange} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="10 Digit TIN" />
                    <button
                      type="button"
                      onClick={handleTINSetup}
                      disabled={isVerifyingTIN || tinVerified}
                      className={`inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md text-sm font-medium transition-colors ${
                        tinVerified ? 'bg-emerald-50 text-emerald-700 cursor-default' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {isVerifyingTIN ? 'Verifying...' : tinVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Director & Login Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Director Full Name</label>
                  <input type="text" name="directorName" value={formData.directorName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Director NIN (National ID)</label>
                  <input type="text" name="directorNin" value={formData.directorNin} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm uppercase" placeholder="CM..." />
                </div>
                
                {/* Contact and MoMo */}
                <div>
                   <label className="block text-sm font-medium text-gray-700">Contact Phone (used for login)</label>
                   <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="+256..." />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                   <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="school@example.com" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">School MoMo Number (For Disbursements)</label>
                   <input type="tel" name="momo_number" value={formData.momo_number} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="+256..." />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700">MoMo Provider</label>
                   <select name="momo_provider" value={formData.momo_provider} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                     <option value="MTN">MTN</option>
                     <option value="AIRTEL">Airtel</option>
                   </select>
                </div>

                {/* PIN Setup */}
                <div className="sm:col-span-2 border-t pt-4 mt-2">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Set Admin Login PIN</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">4-Digit PIN</label>
                      <input type="password" name="pin" maxLength={4} value={formData.pin} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm tracking-widest" placeholder="••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm PIN</label>
                      <input type="password" name="pin_confirm" maxLength={4} value={formData.pin_confirm} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm tracking-widest" placeholder="••••" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Fee Schedule Setup</h3>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`border-2 rounded-xl p-4 text-center cursor-pointer transition-all ${formData.feesMode === 'upload' ? 'border-emerald-500 bg-emerald-50 flex flex-col items-center' : 'border-gray-200 hover:border-emerald-300 flex flex-col items-center'}`}
                  onClick={() => setFormData({...formData, feesMode: 'upload'})}
                >
                  <UploadCloud className={`w-8 h-8 mb-2 ${formData.feesMode === 'upload' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-sm">Upload CSV</span>
                </div>
                <div 
                  className={`border-2 rounded-xl p-4 text-center cursor-pointer transition-all ${formData.feesMode === 'manual' ? 'border-emerald-500 bg-emerald-50 flex flex-col items-center' : 'border-gray-200 hover:border-emerald-300 flex flex-col items-center'}`}
                  onClick={() => setFormData({...formData, feesMode: 'manual'})}
                >
                  <FileText className={`w-8 h-8 mb-2 ${formData.feesMode === 'manual' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-sm">Manual Entry</span>
                </div>
              </div>
              
              {formData.feesMode === 'upload' && (
                <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 text-center">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <button className="text-emerald-700 font-medium hover:underline mb-2">Download CSV Template</button>
                  <div className="mt-4">
                    <label className="px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                      Browse Files
                      <input type="file" className="hidden" accept=".csv" />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Review & Submit</h3>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-500">School Name</div>
                  <div className="font-semibold text-gray-900 text-right">{formData.name || '—'}</div>
                  
                  <div className="text-gray-500">Registration #</div>
                  <div className="font-semibold text-gray-900 text-right">{formData.registrationNumber || '—'}</div>
                  
                  <div className="text-gray-500">TIN</div>
                  <div className="font-semibold text-gray-900 text-right flex justify-end items-center gap-2">
                    {formData.tin || '—'} 
                    {tinVerified && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">Verified</span>}
                  </div>

                  <div className="text-gray-500">District</div>
                  <div className="font-semibold text-gray-900 text-right">{formData.district || '—'}</div>
                  
                  <div className="text-gray-500">Director</div>
                  <div className="font-semibold text-gray-900 text-right">{formData.directorName || '—'}</div>
                  
                  <div className="col-span-2 border-t pt-4 mt-2">
                    <div className="text-xs text-gray-400 text-center">
                      By submitting, you agree to the EduBridge Terms & Conditions.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            ) : <div></div>}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handeNextStep}
                disabled={step === 1 && !tinVerified}
                className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  (step === 1 && !tinVerified) ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-8 py-2 rounded-lg text-sm font-bold text-white transition-colors ${
                  isSubmitting ? 'bg-emerald-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

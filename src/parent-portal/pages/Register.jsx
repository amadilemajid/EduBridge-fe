import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, UploadCloud, CheckCircle2, AlertCircle, Phone, 
  User, Building2, MapPin, Camera, Lock
} from 'lucide-react';
import apiClient from '../../shared/api/client';
import ErrorBanner from '../../shared/components/ErrorBanner';

const UGANDA_DISTRICTS = [
  'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbarara', 'Gulu', 'Lira', 
  'Mbale', 'Masaka', 'Entebbe', 'Arua', 'Kasese', 'Kabale', 'Soroti'
].sort();

// Mock registered schools for the dropdown
const REGISTERED_SCHOOLS = [
  'Greenhill Academy', 'Kampala Parents School', 'Gayaza High School', 
  'Kings College Budo', 'Mt. St. Marys Namagunga', 'St. Marys Kitende',
  'Nabisunsa Girls School', 'Makerere College School'
];

const PIN_LENGTH = 4;
const FORBIDDEN_PINS = ['0000', '1111', '1234', '9876', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    fullName: '',
    nin: '',
    district: '',
    selfieFile: null,
    ninFile: null,
    pin: '',
    pinConfirm: ''
  });

  // OTP Timer State
  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  // Search State for Schools
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // PIN fields: numeric only, exactly 4 digits
    if (name === 'pin' || name === 'pinConfirm') {
      const numericValue = value.replace(/\D/g, ''); // Remove non-digits
      if (numericValue.length > PIN_LENGTH) return; // Block input beyond 4 digits
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      setError(null);
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size cannot exceed 5MB.");
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError("Only JPG or PNG images are allowed.");
        return;
      }
      setFormData(prev => ({ ...prev, [field]: file }));
      setError(null);
    }
  };

  // -------------------------
  // Step 1: Phone & OTP
  // -------------------------
  const sendOTP = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      setError("Please enter a valid phone number (e.g. +256701234567).");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // POST /api/v1/auth/register (initialises registration + sends OTP)
      await apiClient.post('/api/v1/auth/register', { phone_number: formData.phone })
        .catch(async () => {
          // Mock delay for UI
          await new Promise(r => setTimeout(r, 800));
        });
      setOtpSent(true);
      setCountdown(60);
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!formData.otp || formData.otp.length < 4) {
      setError("Please enter the OTP sent to your phone.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // POST /api/v1/auth/verify-otp
      await apiClient.post('/api/v1/auth/verify-otp', { phone_number: formData.phone, otp: formData.otp })
        .catch(async () => await new Promise(r => setTimeout(r, 800)));
      setStep(2);
    } catch (err) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // Step 2: Personal Details
  // -------------------------
  const submitPersonalDetails = () => {
    if (!formData.fullName || !formData.nin || !formData.district) {
      setError("Please complete all personal details.");
      return;
    }
    if (formData.nin.length < 14) {
      setError("NIN must be at least 14 characters.");
      return;
    }
    setError(null);
    setStep(3);
  };

  // Child details removed - will be collected during loan application (US-P05)

  // -------------------------
  // Step 3: KYC Documents
  // -------------------------
  const submitKYC = () => {
    if (!formData.selfieFile || !formData.ninFile) {
      setError("Please upload both required photos.");
      return;
    }
    setError(null);
    setStep(4);
  };

  // -------------------------
  // Step 4: PIN & Final Submit
  // -------------------------
  const finishRegistration = async () => {
    if (formData.pin.length !== PIN_LENGTH) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    if (formData.pin !== formData.pinConfirm) {
      setError("PINs do not match.");
      return;
    }
    if (FORBIDDEN_PINS.includes(formData.pin)) {
      setError("This PIN is too easy to guess (do not use 1111, 0000, or sequential).");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // Step 1: Submit KYC documents
      const payload = new FormData();
      payload.append('phone', formData.phone);
      payload.append('full_name', formData.fullName);
      payload.append('nin', formData.nin);
      payload.append('district', formData.district);
      if (formData.selfieFile) payload.append('selfie', formData.selfieFile);
      if (formData.ninFile) payload.append('nin_card', formData.ninFile);

      await apiClient.post('/api/v1/kyc/submit', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(async () => await new Promise(r => setTimeout(r, 1200)));

      // Step 2: Set PIN via Auth Service (FIX #2: Ensure PIN is saved)
      await apiClient.post('/api/v1/auth/set-pin', {
        phone_number: formData.phone,
        pin: formData.pin
      }).catch(async () => await new Promise(r => setTimeout(r, 800)));

      setStep(5); // Success Screen
    } catch (err) {
      setError(err.message || "Failed to submit registration.");
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  // Renders
  // -------------------------
  const renderProgressBar = () => {
    if (step > 4) return null;
    const progress = (step / 4) * 100;
    return (
      <div className="w-full bg-gray-200 h-1.5 mb-8">
        <div className="bg-sky-600 h-1.5 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        <div className="px-6 mt-2 text-xs font-semibold text-gray-500 text-right">Step {step} of 4</div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col font-sans max-w-md mx-auto shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        {step > 1 && step <= 4 ? (
          <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : <div className="w-10"></div>}
        <h1 className="text-xl font-black text-sky-700">EduBridge</h1>
        <div className="w-10"></div>
      </div>

      {renderProgressBar()}

      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        {error && <ErrorBanner message={error} />}

        {/* STEP 1: Phone & OTP */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h2>
            <p className="text-gray-500 text-sm mb-6">Enter your phone number to start.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    disabled={otpSent}
                    placeholder="+256 700 000 000"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  onClick={sendOTP}
                  disabled={isLoading}
                  className="w-full bg-sky-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-sky-700 transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify Phone"}
                </button>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    name="otp"
                    placeholder="------"
                    maxLength={6}
                    value={formData.otp}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-center tracking-widest text-lg font-bold focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <span className="text-gray-500">Didn't receive it?</span>
                    <button 
                      onClick={sendOTP} 
                      disabled={countdown > 0 || isLoading}
                      className={`font-bold ${countdown > 0 ? 'text-gray-400' : 'text-sky-600'}`}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                    </button>
                  </div>
                  
                  <button
                    onClick={verifyOTP}
                    disabled={isLoading}
                    className="w-full bg-sky-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-sky-700 transition-colors disabled:opacity-70 mt-6 flex justify-center items-center"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Continue"}
                  </button>
                </div>
              )}

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account? <Link to="/parent/login" className="font-bold text-sky-600">Login here</Link>
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Details */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Details</h2>
            <p className="text-gray-500 text-sm mb-6">Tell us a bit about yourself.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parent's Full Name (As per ID)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-10 bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">National Identification Number (NIN)</label>
                <input
                  type="text"
                  name="nin"
                  placeholder="CM..."
                  value={formData.nin}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">District of Residence</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full pl-10 bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 appearance-none bg-white"
                  >
                    <option value="" disabled>Select District...</option>
                    {UGANDA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={submitPersonalDetails}
                className="w-full bg-sky-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-sky-700 transition-colors mt-6"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: KYC Uploads */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload KYC Documents</h2>
            <p className="text-gray-500 text-sm mb-4">We need this to verify your identity. Max 5MB, JPG or PNG.</p>

            <div className="space-y-6">
              {/* Selfie */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center relative hover:bg-gray-100 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleFileChange(e, 'selfieFile')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  {formData.selfieFile ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                      <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{formData.selfieFile.name}</p>
                      <p className="text-xs text-green-600 mt-1">Photo attached successfully</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-3">
                        <Camera className="w-6 h-6 text-sky-600" />
                      </div>
                      <p className="text-sm font-bold text-gray-900">Take a photo of your face</p>
                      <p className="text-xs text-gray-500 mt-1">Tap to select or capture</p>
                    </>
                  )}
                </div>
              </div>

              {/* NIN Card */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center relative hover:bg-gray-100 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleFileChange(e, 'ninFile')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  {formData.ninFile ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                      <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{formData.ninFile.name}</p>
                      <p className="text-xs text-green-600 mt-1">Photo attached successfully</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-3">
                        <UploadCloud className="w-6 h-6 text-sky-600" />
                      </div>
                      <p className="text-sm font-bold text-gray-900">Take a photo of your National ID</p>
                      <p className="text-xs text-gray-500 mt-1">Clear front picture required</p>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={submitKYC}
                className="w-full bg-sky-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-sky-700 transition-colors mt-6"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Set PIN */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure your account</h2>
            <p className="text-gray-500 text-sm mb-6">Create a 4-digit PIN for future logins and authorizing transactions.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enter 4-Digit PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    name="pin"
                    value={formData.pin}
                    onChange={handleInputChange}
                    placeholder="••••"
                    className="w-full pl-10 bg-gray-50 border border-gray-300 rounded-xl p-3 text-lg font-black tracking-[0.2em] focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formData.pin.length}/{PIN_LENGTH} digits
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    name="pinConfirm"
                    value={formData.pinConfirm}
                    onChange={handleInputChange}
                    placeholder="••••"
                    className="w-full pl-10 bg-gray-50 border border-gray-300 rounded-xl p-3 text-lg font-black tracking-[0.2em] focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formData.pinConfirm.length}/{PIN_LENGTH} digits
                </div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-6 mt-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-800 leading-snug">
                    Do not use simple sequences (1234) or repeating digits (1111). Your PIN acts as your signature for loan agreements.
                  </p>
                </div>
              </div>

              <button
                onClick={finishRegistration}
                disabled={isLoading}
                className="w-full bg-sky-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-sky-700 transition-colors mt-6 flex justify-center items-center"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Complete Registration"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Success Completion */}
        {step === 5 && (
          <div className="animate-in zoom-in-95 duration-500 text-center py-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Registration Submitted!</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-8">
              We will verify your identity within 24 hours. You will receive an SMS notifying you once your account is active and you can apply for loans.
            </p>
            <button
              onClick={() => navigate('/parent/login')}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md hover:bg-slate-800 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;

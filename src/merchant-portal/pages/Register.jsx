import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Store, User, IdCard, MapPin, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';
import apiClient from '../../shared/api/client';
import ErrorBanner from '../../shared/components/ErrorBanner';

const DISTRICTS = ['Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Entebbe', 'Masaka', 'Mbarara', 'Gulu', 'Lira', 'Arua'];
const PRODUCT_CATEGORIES = [
  { id: 'uniforms', label: 'Uniforms' },
  { id: 'textbooks', label: 'Textbooks' },
  { id: 'stationery', label: 'Stationery' },
  { id: 'footwear', label: 'Footwear' },
  { id: 'bags', label: 'School Bags' },
  { id: 'boarding', label: 'Boarding Supplies' }
];

const Register = () => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Verification states
  const [isVerifyingNIN, setIsVerifyingNIN] = useState(false);
  const [isVerifyingTIN, setIsVerifyingTIN] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);
  const [tinVerified, setTinVerified] = useState(false);

  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    owner_nin: '',
    phone_number: '',
    tin: '',
    district: '',
    address: '',
    categories: [], // Multi-select
    momo_number: '',
    momo_provider: '', // Auto-detected
    contact_email: '',   // optional
    pin: '',
    pin_confirm: '',
  });

  // MoMo detection logic
  useEffect(() => {
    const num = form.momo_number;
    if (num.length >= 5) {
      if (/^(\+256|0)(77|78|76)/.test(num)) {
        setForm(prev => ({ ...prev, momo_provider: 'MTN' }));
      } else if (/^(\+256|0)(75|70|74)/.test(num)) {
        setForm(prev => ({ ...prev, momo_provider: 'Airtel' }));
      } else {
        setForm(prev => ({ ...prev, momo_provider: '' }));
      }
    } else {
      setForm(prev => ({ ...prev, momo_provider: '' }));
    }
  }, [form.momo_number]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Trigger verification mocks
    if (name === 'owner_nin' && value.length === 14) {
      setIsVerifyingNIN(true);
      setTimeout(() => {
        setIsVerifyingNIN(false);
        setNinVerified(true);
      }, 1500);
    }
    if (name === 'tin' && value.length === 10) {
      setIsVerifyingTIN(true);
      setTimeout(() => {
        setIsVerifyingTIN(false);
        setTinVerified(true);
      }, 1500);
    }
  };

  const handleCategoryToggle = (catId) => {
    setForm(prev => {
      const exists = prev.categories.includes(catId);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== catId) };
      } else {
        return { ...prev, categories: [...prev.categories, catId] };
      }
    });
  };

  const normalizePhone = (p) => {
    let clean = p.trim();
    if (clean.startsWith('0')) {
      return '+256' + clean.substring(1);
    }
    if (!clean.startsWith('+')) {
      return '+' + clean;
    }
    return clean;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) {
      setErrorMsg('PIN must be exactly 4 digits (numbers only).');
      return;
    }
    if (form.pin !== form.pin_confirm) {
      setErrorMsg('PINs do not match. Please re-enter.');
      return;
    }
    if (form.categories.length === 0) {
      setErrorMsg('Please select at least one product category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.shop_name,
        owner_name: form.owner_name,
        owner_nin: form.owner_nin,
        tin: form.tin,
        location: `${form.district}, ${form.address}`,
        category: form.categories[0] || 'mixed',
        contact_phone: normalizePhone(form.phone_number),
        ...(form.contact_email && { contact_email: form.contact_email }),
        momo_number: normalizePhone(form.momo_number || form.phone_number),
        momo_provider: form.momo_provider,
        portal_pin: form.pin
      };

      console.log('Submitting payload:', payload);
      const response = await apiClient.post('/api/v1/merchant/register', payload);
      console.log('Registration response:', response);
      setIsSuccess(true);
    } catch (err) {
      const errors = err.error;
      let msg = err.message || 'Registration failed.';
      if (Array.isArray(errors) && errors.length > 0) {
        msg = errors.map(e => e.msg || e.message).filter(Boolean).join('. ');
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 font-sans">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center border border-gray-100">
          <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Registration received!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Thank you for applying to be an EduBridge Partner Shop. <br/>
            <strong>An EduBridge agent will visit your shop to complete physical verification</strong> before your account is activated.
          </p>
          <button 
            onClick={() => navigate('/merchant/login')} 
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center font-sans tracking-tight">
      <div className="max-w-3xl w-full">
        <div className="flex items-center gap-4 mb-10 justify-center">
            <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                <Store className="w-8 h-8 text-white" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Partner with EduBridge</h2>
                <p className="text-gray-500 font-medium">Accept BNPL payments and grow your school supplies business.</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8 overflow-hidden">
          {errorMsg && <ErrorBanner message={errorMsg} />}

          {/* Business Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Store className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-gray-900">Shop Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Shop / Business Name</label>
                <input name="shop_name" value={form.shop_name} onChange={handleChange} required className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-medium" placeholder="E.g. Kampala Stationery Hub" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">District</label>
                <select name="district" value={form.district} onChange={handleChange} required className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-medium appearance-none">
                  <option value="">Select District</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Physical Location</label>
                <input name="address" value={form.address} onChange={handleChange} required className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-medium" placeholder="Street, Plaza, Room #" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Product Categories</label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                      form.categories.includes(cat.id)
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-amber-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Legal Info */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-gray-900">Legal & Tax</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Owner Full Name</label>
                <input name="owner_name" value={form.owner_name} onChange={handleChange} required className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-medium" placeholder="As seen on National ID" />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Owner NIN</label>
                <input name="owner_nin" value={form.owner_nin} onChange={handleChange} required maxLength={14} className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-black uppercase" placeholder="CM000000000..." />
                {isVerifyingNIN && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Verifying identity...
                  </div>
                )}
                {ninVerified && <div className="absolute right-3 bottom-3 text-[10px] font-bold text-emerald-600">✓ Verified via NIRA</div>}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Business TIN</label>
                <input name="tin" value={form.tin} onChange={handleChange} required maxLength={10} className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-black" placeholder="10-digit TIN" />
                {isVerifyingTIN && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Verifying URA...
                  </div>
                )}
                {tinVerified && <div className="absolute right-3 bottom-3 text-[10px] font-bold text-emerald-600">✓ Verified via URA</div>}
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <Smartphone className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-gray-900">Payments & Credentials</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Disbursement MoMo #</label>
                <input name="momo_number" type="tel" value={form.momo_number} onChange={handleChange} required className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-black" placeholder="07XXXXXXXX" />
                {form.momo_provider && (
                  <div className={`absolute right-3 bottom-3 text-[10px] font-black px-2 py-1 rounded-md ${form.momo_provider === 'MTN' ? 'bg-yellow-400 text-yellow-900' : 'bg-red-500 text-white'}`}>
                    {form.momo_provider}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Application Phone #</label>
                <input name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} required className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-black" placeholder="07XXXXXXXX" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Set Login PIN</label>
                <input name="pin" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={form.pin} onChange={handleChange} required className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-black tracking-widest" placeholder="••••" />
                <p className="text-[10px] text-gray-400 mt-1 font-medium">4 digits only</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Confirm PIN</label>
                <input name="pin_confirm" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={form.pin_confirm} onChange={handleChange} required className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-black tracking-widest" placeholder="••••" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Contact Email <span className="text-gray-300 font-normal normal-case">(optional — for disbursement receipts)</span></label>
                <input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} className="block w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-amber-500 transition-all font-medium" placeholder="shop@example.com" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
             <div className="flex gap-3">
               <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
               <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                 <span className="font-black uppercase block mb-0.5">Note on Onboarding Fee</span>
                 A one-time onboarding fee of <strong>UGX 30,000</strong> will be deducted from your first disbursement to cover verification and terminal setup costs.
               </p>
             </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-5 rounded-2xl font-black text-white text-lg transition-all shadow-xl hover:shadow-amber-500/20 ${isSubmitting ? 'bg-gray-200 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'}`}
          >
            {isSubmitting ? 'Registering Shop...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;

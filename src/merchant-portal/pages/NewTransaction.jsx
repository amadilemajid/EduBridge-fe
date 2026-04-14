import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Lock,
  List
} from 'lucide-react';
import apiClient from '../../shared/api/client';
import ErrorBanner from '../../shared/components/ErrorBanner';

const ELIGIBLE_CATEGORIES = [
  'Uniforms', 'Textbooks', 'Stationery', 'Footwear', 'School Bags', 'Boarding Supplies'
];

const NewTransaction = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form State
  const [parentPhone, setParentPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [itemsDescription, setItemsDescription] = useState('');
  const [category, setCategory] = useState(ELIGIBLE_CATEGORIES[0]);

  // Success State
  const [txnResult, setTxnResult] = useState(null);

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const normalizePhone = (phone) => {
    if (!phone) return phone;
    let cleaned = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '+256' + cleaned.substring(1);
    } else if (cleaned.startsWith('256')) {
      cleaned = '+' + cleaned;
    } else if (/^[7][0-9]{8}$/.test(cleaned)) {
      cleaned = '+256' + cleaned;
    }
    return cleaned;
  };

  const initiateTransaction = async () => {
    if (!parentPhone || !amount || !itemsDescription) return;
    
    setLoading(true);
    setError(null);
    try {
      // Use the normalized phone number
      const normalizedPhone = normalizePhone(parentPhone);
      
      const payload = {
        parent_phone: normalizedPhone,
        amount: Number(amount),
        items: [{ name: category, quantity: 1 }],
        items_description: itemsDescription
      };

      console.log('[NewTransaction] Sending payload:', payload);
      const res = await apiClient.post('/api/v1/merchant/transaction/initiate', payload);
      
      setTxnResult({ 
        success: true, 
        id: res.data.transaction_id,
        expiresAt: res.data.otp_expires_at,
        message: res.data.message
      });
      setStep(2);
    } catch (err) {
      console.error('[NewTransaction] Full error:', err);
      console.error('[NewTransaction] Error message:', err.message);
      // The error handler normalizes the error, so use the message field
      setError(err.message || 'Failed to initiate transaction.');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen (Awaiting Parent)
  if (step === 2 && txnResult?.success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans tracking-tight py-12">
        <div className="max-w-xl w-full bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl text-center border border-gray-100 animate-in zoom-in duration-300">
          <div className="mx-auto h-24 w-24 rounded-full bg-amber-50 flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"></div>
            <Lock className="h-10 w-10 text-amber-600 relative z-10 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Awaiting Parent</h2>
          <p className="text-base font-bold text-amber-600 mb-8 uppercase tracking-widest leading-relaxed px-4">
             Transaction Securely Initiated
          </p>
          
          <div className="bg-gray-50 rounded-3xl p-8 mb-8 text-left space-y-4 border border-gray-100">
            <p className="text-sm text-gray-700 font-medium mb-4 pb-4 border-b border-gray-200 leading-relaxed text-center">
              An authorization SMS has been sent to the parent's phone. They must securely confirm this transaction.
            </p>
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount</span>
              <span className="text-lg font-black text-gray-900">UGX {Number(amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expires</span>
              <span className="text-sm font-black text-amber-600 font-mono">{formatTime(txnResult.expiresAt)}</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
            Once confirmed by the parent, the funds will be settled to your shop wallet within 4 hours.
          </p>

          <button 
            onClick={() => navigate('/merchant/dashboard')} 
            className="w-full py-5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-lg transition-all shadow-xl hover:shadow-black/10 active:scale-95"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto font-sans tracking-tight pb-20">
      <div className="mb-8 space-y-2 text-center md:text-left">
         <h2 className="text-4xl font-black text-gray-900 leading-tight">Initiate BNPL Purchase</h2>
         <p className="text-gray-500 font-medium">Capture details to send an authorization request to the parent.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
               <p className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Verifying Limits</p>
             </div>
          </div>
        )}

        <div className="p-8 md:p-12">
          {error && <div className="mb-8"><ErrorBanner message={error} /></div>}

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Split Grid for Phone & Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Parent Phone</label>
                <div className="relative group">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="tel" 
                    placeholder="07XXXXXXXX" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 flex-1 pl-12 pr-4 text-lg font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-200 transition-all text-gray-900 placeholder-gray-300"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Total Amount (UGX)</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/50 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 flex-1 pl-12 pr-4 text-lg font-black focus:ring-4 focus:ring-amber-500/10 focus:border-amber-200 transition-all text-amber-600 placeholder-amber-200/50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Split Grid for Category & Description */}
            <div className="space-y-6 pt-4 border-t border-gray-50">
                <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Supply Category</label>
                <div className="relative group">
                    <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                    <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-gray-900 font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-200 transition-all appearance-none outline-none"
                    >
                        {ELIGIBLE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                </div>

                <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2">Item Description (Receipt Details)</label>
                <div className="relative group">
                    <List className="absolute left-4 top-5 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                    <textarea 
                        rows="3"
                        placeholder="E.g. 2x Senior Shirts, 1x Math Textbook, 3x Counter Books" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-5 text-gray-900 font-medium focus:ring-4 focus:ring-amber-500/10 focus:border-amber-200 transition-all resize-none outline-none placeholder-gray-300"
                        value={itemsDescription}
                        onChange={(e) => setItemsDescription(e.target.value)}
                    />
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-2 ml-2 flex items-center gap-1.5 uppercase tracking-widest">
                    <AlertCircle className="w-3 h-3" />
                    Ineligible items (electronics, food) trigger compliance rejection.
                </p>
                </div>
            </div>

            <button 
              onClick={initiateTransaction}
              disabled={!parentPhone || !amount || !itemsDescription || loading}
              className="w-full mt-8 py-5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-gray-100 disabled:text-gray-300 text-white font-black text-lg transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              Verify Limits & Send Request
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTransaction;

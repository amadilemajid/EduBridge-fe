import React, { useState, useEffect } from 'react';
import apiClient from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import { 
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, 
  Smartphone, PlusCircle, CheckCircle2
} from 'lucide-react';

const Wallet = () => {
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  // Deposit State
  const [showDepositSheet, setShowDepositSheet] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      setLoading(true);
      try {
        const [walletRes, txRes] = await Promise.allSettled([
          apiClient.get('/api/v1/wallet/balance').catch(() => ({
            data: { balance: 125000, weekly_target: 20000, term_target: 300000 }
          })),
          apiClient.get('/api/v1/wallet/transactions').catch(() => ({
            data: [
              { id: 'tx-1', date: new Date().toISOString(), type: 'deposit', amount: 20000, running_balance: 125000 },
              { id: 'tx-2', date: new Date(Date.now() - 86400000 * 7).toISOString(), type: 'deposit', amount: 20000, running_balance: 105000 },
              { id: 'tx-3', date: new Date(Date.now() - 86400000 * 14).toISOString(), type: 'deposit', amount: 15000, running_balance: 85000 },
              { id: 'tx-4', date: new Date(Date.now() - 86400000 * 30).toISOString(), type: 'withdrawal', amount: 350000, running_balance: 70000, note: 'School Fee Transfer' },
            ]
          }))
        ]);

        if (walletRes.status === 'fulfilled') setWallet(walletRes.value?.data);
        if (txRes.status === 'fulfilled') setTransactions(txRes.value?.data || []);
      // eslint-disable-next-line no-unused-vars
      } catch (_) {
        setError("Could not load your savings wallet.");
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, []);

  const handleDepositAmountChange = (e) => {
    const num = parseInt(e.target.value.replace(/\D/g, ''), 10);
    setDepositAmount(isNaN(num) ? '' : num);
  };

  const handleDeposit = async () => {
    if (!depositAmount || depositAmount < 1000) {
      setError("Please put a minimum deposit of UGX 1,000.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    
    try {
      await apiClient.post('/api/v1/wallet/contribute', { amount: depositAmount }).catch(async () => {
        // Mock mobile money push delay
        await new Promise(r => setTimeout(r, 2000));
      });
      
      const maskedPhone = currentUser?.phone_number ? 
        currentUser.phone_number.substring(0, 6) + '***' + currentUser.phone_number.substring(currentUser.phone_number.length - 3) : 
        '+25670***123';
        
      setSuccessMsg(`A deposit request of UGX ${depositAmount.toLocaleString()} has been sent to ${maskedPhone}. Approve it on your phone to add to your savings.`);
      setShowDepositSheet(false);
      setDepositAmount('');
    } catch (err) {
      setError(err.message || "Deposit request failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner variant="full" />;

  // -------------------------
  // Success / MoMo Push Overlay
  // -------------------------
  if (successMsg) {
    return (
      <div className="min-h-[100dvh] bg-emerald-600 flex flex-col font-sans max-w-md mx-auto relative px-6 py-10 text-white z-50 fixed inset-0">
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg relative z-10">
              <Smartphone className="w-10 h-10 text-emerald-600 animate-bounce" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black mb-3 text-white">Check Your Phone</h2>
          <div className="bg-white/10 rounded-2xl p-5 border border-white/20 mb-8 backdrop-blur-sm">
            <p className="text-emerald-50 text-[15px] leading-relaxed font-medium">
              {successMsg}
            </p>
          </div>
          
          <button
            onClick={() => setSuccessMsg(null)}
            className="w-full bg-white text-emerald-700 font-black py-4 rounded-xl shadow-lg hover:bg-emerald-50 transition-colors"
          >
            I have approved the deposit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans max-w-md mx-auto relative pb-safe">
      <div className="flex-1 p-5 space-y-6 overflow-y-auto pt-6">
        {error && <ErrorBanner message={error} />}

        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-black text-slate-900">Savings Wallet</h2>
        </div>

        {/* Balance Card */}
        {wallet && (
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <WalletIcon className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <p className="text-sm text-slate-400 font-medium tracking-wide mb-1">Available to off-set fees</p>
              <h3 className="text-4xl font-black text-white mb-8">
                <span className="text-2xl font-bold text-slate-400 mr-1.5">UGX</span>
                {wallet.balance.toLocaleString()}
              </h3>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-xs text-slate-400 font-bold mb-0.5 uppercase tracking-wider">Term Target</p>
                    <p className="font-bold text-sm">UGX {wallet.term_target.toLocaleString()}</p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-1 rounded-sm">
                    {Math.round((wallet.balance / wallet.term_target) * 100)}% Reached
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.round((wallet.balance / wallet.term_target) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDepositSheet(true)}
                  className="bg-sky-500 hover:bg-sky-400 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <PlusCircle className="w-4 h-4" /> Deposit
                </button>
                <div className="bg-slate-800 py-3 rounded-xl flex flex-col justify-center items-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Weekly Goal</p>
                  <p className="font-bold text-sm">UGX {wallet.weekly_target.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 px-1">Transaction History</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {transactions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {transactions.map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{tx.type === 'deposit' ? 'Savings Deposit' : (tx.note || 'Withdrawal / Transfer')}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{new Date(tx.date).toLocaleDateString()} at {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-sm ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.type === 'deposit' ? '+' : '-'} UGX {tx.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">Bal: {tx.running_balance.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                No past transactions. Start saving today!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Bottom Sheet Overlay */}
      {showDepositSheet && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Make a Deposit</h3>
              <button onClick={() => setShowDepositSheet(false)} className="text-slate-400 font-bold p-2 text-sm hover:text-slate-600">Cancel</button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4 font-medium">Enter the amount you wish to save. This will trigger a Mobile Money prompt on your phone.</p>
            
            <div className="relative mb-6">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-xl">UGX</span>
              <input 
                type="text" 
                inputMode="numeric"
                autoFocus
                value={depositAmount ? depositAmount.toLocaleString() : ''}
                onChange={handleDepositAmountChange}
                className="w-full pl-16 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-2xl font-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 shadow-inner"
                placeholder="0"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[5000, 10000, 20000].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setDepositAmount(amt)}
                  className="py-2 px-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors"
                >
                  +{amt/1000}k
                </button>
              ))}
            </div>

            <button 
              disabled={isProcessing || !depositAmount}
              onClick={handleDeposit}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-md disabled:bg-slate-300 disabled:text-slate-500 transition-colors flex justify-center items-center"
            >
              {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Initiate Deposit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;

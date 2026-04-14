import React, { useEffect, useState } from 'react';
import apiClient from '../../shared/api/client';
import LoadingSpinner from '../../shared/components/LoadingSpinner';
import ErrorBanner from '../../shared/components/ErrorBanner';
import EmptyState from '../../shared/components/EmptyState';
import SuccessToast from '../../shared/components/SuccessToast';
import BNPLEligibilityStatus from '../components/BNPLEligibilityStatus';
import { MapPin } from 'lucide-react';

// US-P09 – US-P13: BNPL supplies flow
const BNPL = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview'); // overview | shops | transactions
  const [eligibility, setEligibility] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [shops, setShops] = useState([]);
  const [filterDistrict, setFilterDistrict] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [elig, txns, shopsRes] = await Promise.allSettled([
          apiClient.get('/api/v1/bnpl/eligibility'),
          apiClient.get('/api/v1/bnpl/transactions'),
          apiClient.get('/api/v1/shops?active=true'),
        ]);
        if (elig.status === 'fulfilled') setEligibility(elig.value?.data);
        if (txns.status === 'fulfilled') setTransactions(txns.value?.data || []);
        if (shopsRes.status === 'fulfilled') setShops(shopsRes.value?.data || []);
      } catch { setError('Could not load BNPL data.'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner variant="full" />;

  const filteredShops = filterDistrict ? shops.filter(s => s.district === filterDistrict) : shops;
  const districts = [...new Set(shops.map(s => s.district).filter(Boolean))];
  const remaining = (eligibility?.credit_limit || 0) - (eligibility?.used || 0);

  const STATUS_STYLE = { confirmed: 'bg-green-100 text-green-800', pending: 'bg-amber-100 text-amber-800', failed: 'bg-red-100 text-red-800' };

  return (
    <div className="space-y-5">
      <SuccessToast message={toast} visible={!!toast} onClose={() => setToast(null)} />
      {error && <ErrorBanner message={error} />}

      <h2 className="text-xl font-extrabold text-gray-900">Supplies BNPL</h2>

      {/* Eligibility Status Banner */}
      <BNPLEligibilityStatus eligibility={eligibility} />

      {/* Credit summary bar */}
      {eligibility && eligibility.is_eligible && (
        <div className="bg-amber-500 text-white rounded-xl p-4 shadow-sm">
          <p className="text-amber-100 text-xs mb-1">Available Supplies Credit</p>
          <p className="text-3xl font-black">UGX {remaining.toLocaleString()}</p>
          <p className="text-amber-200 text-xs mt-1">of UGX {(eligibility.credit_limit || 0).toLocaleString()} limit</p>
          <div className="mt-2 bg-white/30 rounded-full h-2 w-full">
            <div className="bg-white h-2 rounded-full" style={{ width: `${Math.min(((eligibility.used || 0) / (eligibility.credit_limit||1))*100,100)}%` }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[['overview', 'Overview'], ['shops', 'Find Shops'], ['transactions', 'My Transactions']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${tab === key ? 'border-amber-500 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-900">How Supplies BNPL Works</h3>
          <ul className="space-y-2 text-sm text-gray-600 list-none">
            {[
              '1. Visit an EduBridge partner shop listed below.',
              '2. The shop enters your phone number and the purchase amount.',
              '3. You receive a 6-digit OTP — read it to the shopkeeper.',
              '4. Goods released immediately. EduBridge pays the shop.',
              '5. Repay weekly via Mobile Money over your agreed schedule.',
            ].map(s => (
              <li key={s} className="flex items-start gap-2">
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
          <button onClick={() => setTab('shops')} className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition-colors">
            Find a Partner Shop Near You
          </button>
        </div>
      )}

      {tab === 'shops' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter by District</label>
            <select value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)}
              className="block w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-amber-400">
              <option value="">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {filteredShops.length === 0 ? (
            <EmptyState message="No active partner shops found in this area." />
          ) : (
            filteredShops.map((shop, idx) => (
              <div key={shop.id || idx} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3 shadow-sm">
                <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                  <MapPin className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{shop.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{shop.category?.replace('_', ' ')} · {shop.district}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{shop.location || '—'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'transactions' && (
        transactions.length === 0 ? (
          <EmptyState message="No BNPL transactions yet." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {transactions.map((txn, idx) => (
                <div key={txn.id || idx} className="px-5 py-4 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{txn.shop_name || 'Partner Shop'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{txn.items_description || '—'}</p>
                    <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">UGX {(txn.amount || 0).toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[txn.status] || 'bg-gray-100 text-gray-600'}`}>{txn.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default BNPL;

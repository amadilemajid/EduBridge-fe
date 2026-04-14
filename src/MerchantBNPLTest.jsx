import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function MerchantBNPLTest() {
  const [phone, setPhone] = useState('+256789380167');
  const [password, setPassword] = useState('1234');
  const [token, setToken] = useState('');
  const [shopInfo, setShopInfo] = useState(null);
  
  const [parentPhone, setParentPhone] = useState('+256700000001');
  const [amount, setAmount] = useState('');
  const [items, setItems] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [otp, setOtp] = useState('');
  
  const [transactions, setTransactions] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const login = async () => {
    if (!phone || !password) {
      setError('Please enter phone and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE}/api/v1/merchant/test-login`, {
        contact_phone: phone,
        pin: password
      });
      
      setToken(response.data.token || response.data.access_token);
      setShopInfo(response.data.shop || response.data);
      setSuccess('✅ Logged in successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const initiateTransaction = async () => {
    if (!token) {
      setError('Please login first');
      return;
    }
    if (!parentPhone || !amount || !items) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_BASE}/api/v1/merchant/test-initiate`,
        {
          shop_id: shopInfo.id,
          parent_phone: parentPhone,
          amount: parseFloat(amount),
          items_description: items
        }
      );
      
      setTransactionId(response.data.transaction_id);
      setSuccess(`✅ Transaction initiated! ID: ${response.data.transaction_id}. OTP sent to parent.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate transaction');
    } finally {
      setLoading(false);
    }
  };

  const confirmTransaction = async () => {
    if (!token || !transactionId || !otp) {
      setError('Please enter transaction ID and OTP');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE}/api/v1/supplies/confirm`, {
        transaction_id: transactionId,
        otp: otp
      });
      
      setSuccess('✅ Transaction confirmed! Payment will be disbursed to your account.');
      setTransactionId('');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm transaction');
    } finally {
      setLoading(false);
    }
  };

  const viewTransactions = async () => {
    if (!token || !shopInfo) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/api/v1/merchant/test-transactions`, {
        params: { shop_id: shopInfo.id }
      });
      setTransactions(response.data.transactions || []);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const viewDisbursements = async () => {
    if (!token || !shopInfo) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/api/v1/merchant/test-disbursements`, {
        params: { shop_id: shopInfo.id }
      });
      setDisbursements(response.data.disbursements || []);
    } catch (err) {
      setError('Failed to load disbursements');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#1a73e8', marginBottom: '10px' }}>🏪 Merchant Portal - BNPL Test</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Test merchant-initiated BNPL transactions</p>

      {error && (
        <div style={{ marginBottom: '20px', padding: '12px', background: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c33' }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{ marginBottom: '20px', padding: '12px', background: '#efe', border: '1px solid #cfc', borderRadius: '4px', color: '#3c3' }}>
          {success}
        </div>
      )}

      {/* Login Section */}
      {!token && (
        <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
          <h2 style={{ marginTop: 0 }}>Merchant Login</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone Number:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256789380167"
              style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>PIN:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter PIN"
              style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={login}
            disabled={loading}
            style={{ background: '#1a73e8', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div style={{ marginTop: '20px', padding: '15px', background: '#e8f0fe', borderRadius: '4px' }}>
            <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Test Merchant:</strong></p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>Phone: +256789380167</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>PIN: 1234</p>
          </div>
        </div>
      )}

      {/* Logged In View */}
      {token && (
        <>
          {shopInfo && (
            <div style={{ background: '#e8f0fe', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
              <h3 style={{ marginTop: 0 }}>👤 Logged in as: {shopInfo.name || shopInfo.business_name || 'Merchant'}</h3>
              <button
                onClick={() => { setToken(''); setShopInfo(null); }}
                style={{ background: '#ea4335', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          )}

          {/* Initiate Transaction */}
          <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
            <h2 style={{ marginTop: 0 }}>Step 1: Initiate BNPL Transaction</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Parent Phone Number:</label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+256700000001"
                style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Amount (UGX):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 75000"
                style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Items Description:</label>
              <textarea
                value={items}
                onChange={(e) => setItems(e.target.value)}
                placeholder="e.g., School uniform, 3x notebooks"
                rows="3"
                style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={initiateTransaction}
              disabled={loading}
              style={{ background: '#1a73e8', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Initiating...' : 'Initiate Transaction'}
            </button>
          </div>

          {/* Confirm Transaction */}
          <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
            <h2 style={{ marginTop: 0 }}>Step 2: Confirm with Parent's OTP</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Transaction ID:</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Auto-filled from Step 1"
                style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>OTP (from Parent):</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Parent provides 6-digit OTP"
                style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                Get OTP: docker logs edubridge_supplies_bnpl 2{'>'}{'&'}1 | Select-String "TEST OTP" | Select-Object -Last 1
              </small>
            </div>

            <button
              onClick={confirmTransaction}
              disabled={loading}
              style={{ background: '#34a853', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Confirming...' : 'Confirm Transaction'}
            </button>
          </div>

          {/* View Transactions & Disbursements */}
          <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
            <h2 style={{ marginTop: 0 }}>My Transactions & Disbursements</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={viewTransactions}
                disabled={loading}
                style={{ background: '#fbbc04', color: '#000', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                View Transactions
              </button>
              
              <button
                onClick={viewDisbursements}
                disabled={loading}
                style={{ background: '#34a853', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                View Disbursements
              </button>
            </div>

            {transactions.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3>Transactions</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {transactions.map((txn) => (
                    <div key={txn.txn_id} style={{ background: 'white', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
                      <p><strong>ID:</strong> {txn.txn_id}</p>
                      <p><strong>Amount:</strong> UGX {txn.total_amount?.toLocaleString()}</p>
                      <p><strong>Items:</strong> {txn.items_description}</p>
                      <p><strong>Status:</strong> <span style={{ color: txn.status === 'confirmed' ? '#34a853' : '#fbbc04' }}>{txn.status}</span></p>
                      <p><strong>Date:</strong> {new Date(txn.transacted_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {disbursements.length > 0 && (
              <div>
                <h3>Disbursements</h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {disbursements.map((disb) => (
                    <div key={disb.id} style={{ background: 'white', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
                      <p><strong>Amount:</strong> UGX {disb.amount?.toLocaleString()}</p>
                      <p><strong>Status:</strong> {disb.status}</p>
                      <p><strong>Date:</strong> {new Date(disb.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

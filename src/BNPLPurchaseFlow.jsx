import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function BNPLPurchaseFlow() {
  const [parentId, setParentId] = useState('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  const [shopId, setShopId] = useState('');
  const [amount, setAmount] = useState('');
  const [items, setItems] = useState('');
  const [shops, setShops] = useState([]);
  const [transactionId, setTransactionId] = useState('');
  const [otp, setOtp] = useState('');
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadShops = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/supplies/shops`);
      setShops(response.data.shops || []);
    } catch (err) {
      setError('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const applyForCredit = async () => {
    if (!parentId || !shopId || !amount || !items) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE}/api/v1/supplies/apply`, {
        parent_id: parentId,
        shop_id: shopId,
        amount: parseFloat(amount),
        items_description: items
      });
      
      setTransactionId(response.data.transaction_id || response.data.id);
      setSuccess(`✅ Application submitted! Transaction ID: ${response.data.transaction_id || response.data.id}. OTP sent (check logs).`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply for credit');
    } finally {
      setLoading(false);
    }
  };

  const confirmTransaction = async () => {
    if (!transactionId || !otp) {
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
      
      setSuccess('✅ Transaction confirmed! Loan disbursed to shop.');
      setTransactionId('');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm transaction');
    } finally {
      setLoading(false);
    }
  };

  const viewLoans = async () => {
    if (!parentId) {
      setError('Please enter Parent ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/api/v1/supplies/loans`, {
        params: { parent_id: parentId }
      });
      setLoans(response.data.loans || []);
    } catch (err) {
      setError('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadShops();
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#1a73e8', marginBottom: '10px' }}>🛒 BNPL Purchase Flow Test</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Test the complete Buy Now Pay Later purchase process</p>

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

      {/* Step 1: Apply for Credit */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0 }}>Step 1: Apply for BNPL Credit</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Parent ID:</label>
          <input
            type="text"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Select Shop:</label>
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">-- Select a shop --</option>
            {shops.map(shop => (
              <option key={shop.shop_id} value={shop.shop_id}>{shop.name} ({shop.category})</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Amount (UGX):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 50000"
            style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Items Description:</label>
          <textarea
            value={items}
            onChange={(e) => setItems(e.target.value)}
            placeholder="e.g., 2x Exercise books, 1x Pen set"
            rows="3"
            style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          onClick={applyForCredit}
          disabled={loading}
          style={{ background: '#1a73e8', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Applying...' : 'Apply for Credit'}
        </button>
      </div>

      {/* Step 2: Confirm with OTP */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0 }}>Step 2: Confirm Transaction with OTP</h2>
        
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
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>OTP Code:</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Check Docker logs: docker logs edubridge_supplies_bnpl | grep OTP
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

      {/* Step 3: View Loans */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Step 3: View Active Loans</h2>
        
        <button
          onClick={viewLoans}
          disabled={loading}
          style={{ background: '#fbbc04', color: '#000', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: '20px' }}
        >
          {loading ? 'Loading...' : 'View My Loans'}
        </button>

        {loans.length > 0 && (
          <div style={{ display: 'grid', gap: '15px' }}>
            {loans.map((loan) => (
              <div key={loan.loan_id || loan.supplies_loan_id} style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <h3 style={{ marginTop: 0, color: '#1a73e8' }}>Loan #{loan.loan_id || loan.supplies_loan_id}</h3>
                <p><strong>Shop:</strong> {loan.shop_name || 'N/A'}</p>
                <p><strong>Amount:</strong> UGX {loan.amount?.toLocaleString()}</p>
                <p><strong>Amount Repaid:</strong> UGX {loan.amount_repaid?.toLocaleString()}</p>
                <p><strong>Outstanding:</strong> UGX {loan.outstanding_balance?.toLocaleString()}</p>
                <p><strong>Status:</strong> <span style={{ color: loan.status === 'active' ? '#34a853' : '#666' }}>{loan.status}</span></p>
                <p><strong>Due Date:</strong> {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            ))}
          </div>
        )}

        {loans.length === 0 && !loading && (
          <p style={{ color: '#666' }}>No active loans found.</p>
        )}
      </div>
    </div>
  );
}

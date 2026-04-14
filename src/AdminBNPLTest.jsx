import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function AdminBNPLTest() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [pendingShops, setPendingShops] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const viewAllTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/supplies/admin/transactions`);
      setAllTransactions(response.data.transactions || []);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const viewAllLoans = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/supplies/admin/loans`);
      setAllLoans(response.data.loans || []);
    } catch (err) {
      setError('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const viewPendingShops = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/supplies/admin/shops/pending`);
      setPendingShops(response.data.shops || []);
    } catch (err) {
      setError('Failed to load pending shops');
    } finally {
      setLoading(false);
    }
  };

  const approveShop = async (shopId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE}/api/v1/supplies/admin/shops/${shopId}/approve`);
      setSuccess(`✅ Shop ${shopId} approved!`);
      viewPendingShops();
    } catch (err) {
      setError('Failed to approve shop');
    } finally {
      setLoading(false);
    }
  };

  const rejectShop = async (shopId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE}/api/v1/supplies/admin/shops/${shopId}/reject`);
      setSuccess(`✅ Shop ${shopId} rejected!`);
      viewPendingShops();
    } catch (err) {
      setError('Failed to reject shop');
    } finally {
      setLoading(false);
    }
  };

  const triggerDisbursement = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${API_BASE}/api/v1/supplies/admin/disburse-batch`);
      setSuccess(`✅ Batch disbursement completed! ${response.data.count || 0} disbursements processed.`);
    } catch (err) {
      setError('Failed to trigger disbursement');
    } finally {
      setLoading(false);
    }
  };

  const viewStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/api/v1/supplies/admin/stats`);
      setStats(response.data);
    } catch (err) {
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#1a73e8', marginBottom: '10px' }}>⚙️ Admin Portal - BNPL Management</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Monitor and manage the BNPL system</p>

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

      {/* System Stats */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0 }}>📊 System Statistics</h2>
        
        <button
          onClick={viewStats}
          disabled={loading}
          style={{ background: '#1a73e8', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: '20px' }}
        >
          {loading ? 'Loading...' : 'Load Statistics'}
        </button>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Total Loans</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1a73e8' }}>{stats.total_loans || 0}</p>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Total Amount</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#34a853' }}>UGX {stats.total_amount?.toLocaleString() || 0}</p>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Active Loans</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#fbbc04' }}>{stats.active_loans || 0}</p>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666' }}>Verified Shops</h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#34a853' }}>{stats.verified_shops || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Pending Shop Approvals */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0 }}>🏪 Pending Shop Approvals</h2>
        
        <button
          onClick={viewPendingShops}
          disabled={loading}
          style={{ background: '#fbbc04', color: '#000', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: '20px' }}
        >
          {loading ? 'Loading...' : 'Load Pending Shops'}
        </button>

        {pendingShops.length > 0 && (
          <div style={{ display: 'grid', gap: '15px' }}>
            {pendingShops.map((shop) => (
              <div key={shop.shop_id} style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0' }}>{shop.name}</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>📍 {shop.location}</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>📞 {shop.contact_phone}</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>🏢 TIN: {shop.tin}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => approveShop(shop.shop_id)}
                    disabled={loading}
                    style={{ background: '#34a853', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => rejectShop(shop.shop_id)}
                    disabled={loading}
                    style={{ background: '#ea4335', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pendingShops.length === 0 && !loading && (
          <p style={{ color: '#666' }}>No pending shop approvals.</p>
        )}
      </div>

      {/* Batch Disbursement */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0 }}>💰 Batch Disbursement</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Manually trigger disbursement of confirmed transactions to shops</p>
        
        <button
          onClick={triggerDisbursement}
          disabled={loading}
          style={{ background: '#34a853', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Processing...' : 'Trigger Batch Disbursement'}
        </button>
      </div>

      {/* All Transactions */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0 }}>📋 All BNPL Transactions</h2>
        
        <button
          onClick={viewAllTransactions}
          disabled={loading}
          style={{ background: '#1a73e8', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: '20px' }}
        >
          {loading ? 'Loading...' : 'Load All Transactions'}
        </button>

        {allTransactions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', background: 'white', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e8f0fe' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Transaction ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Shop</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Parent</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.map((txn) => (
                  <tr key={txn.txn_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '12px' }}>{txn.txn_id.substring(0, 8)}...</td>
                    <td style={{ padding: '12px' }}>{txn.shop_name || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{txn.parent_name || 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>UGX {txn.total_amount?.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        background: txn.status === 'confirmed' ? '#e6f4ea' : '#fef7e0',
                        color: txn.status === 'confirmed' ? '#137333' : '#b06000'
                      }}>
                        {txn.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(txn.transacted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Loans */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>💳 All BNPL Loans</h2>
        
        <button
          onClick={viewAllLoans}
          disabled={loading}
          style={{ background: '#1a73e8', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginBottom: '20px' }}
        >
          {loading ? 'Loading...' : 'Load All Loans'}
        </button>

        {allLoans.length > 0 && (
          <div style={{ display: 'grid', gap: '15px' }}>
            {allLoans.map((loan) => (
              <div key={loan.supplies_loan_id} style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Parent</p>
                    <p style={{ margin: '5px 0', fontWeight: '500' }}>{loan.parent_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Shop</p>
                    <p style={{ margin: '5px 0', fontWeight: '500' }}>{loan.shop_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Amount</p>
                    <p style={{ margin: '5px 0', fontWeight: '500' }}>UGX {loan.amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Outstanding</p>
                    <p style={{ margin: '5px 0', fontWeight: '500', color: '#ea4335' }}>UGX {loan.outstanding_balance?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Status</p>
                    <p style={{ margin: '5px 0', fontWeight: '500', color: loan.status === 'active' ? '#34a853' : '#666' }}>{loan.status}</p>
                  </div>
                  <div>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Due Date</p>
                    <p style={{ margin: '5px 0', fontWeight: '500' }}>{loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

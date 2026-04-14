import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010';

export default function BNPLTestPage() {
  const [parentId, setParentId] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkEligibility = async () => {
    if (!parentId) {
      setError('Please enter a Parent ID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE}/api/v1/supplies/eligibility`, {
        params: { parent_id: parentId }
      });
      setEligibility(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const loadShops = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/v1/supplies/shops`);
      setShops(response.data.shops || []);
    } catch (err) {
      setError('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#1a73e8', marginBottom: '10px' }}>🎒 BNPL School Supplies - Test Page</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Test the Buy Now Pay Later eligibility and shop features</p>

      {/* Eligibility Check Section */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0 }}>Check BNPL Eligibility</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Parent ID (UUID):
          </label>
          <input
            type="text"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            Use a test parent ID from your database
          </small>
        </div>

        <button
          onClick={checkEligibility}
          disabled={loading}
          style={{
            background: '#1a73e8',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Checking...' : 'Check Eligibility'}
        </button>

        {error && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33'
          }}>
            ❌ {error}
          </div>
        )}

        {eligibility && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              {eligibility.eligible ? '✅ Eligible' : '❌ Not Eligible'}
            </h3>
            
            {eligibility.eligible ? (
              <div>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a73e8', margin: '10px 0' }}>
                  Credit Limit: UGX {eligibility.credit_limit?.toLocaleString()}
                </p>
                <p style={{ color: '#666' }}>Risk Score: {eligibility.risk_score}</p>
                <p style={{ color: '#666' }}>Available Credit: UGX {eligibility.available_credit?.toLocaleString()}</p>
              </div>
            ) : (
              <div>
                <p style={{ color: '#c33', fontWeight: '500' }}>Reason: {eligibility.reason}</p>
                {eligibility.details && (
                  <ul style={{ color: '#666', marginTop: '10px' }}>
                    {Object.entries(eligibility.details).map(([key, value]) => (
                      <li key={key}>{key}: {String(value)}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shops Section */}
      <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Approved Merchant Shops</h2>
        
        <button
          onClick={loadShops}
          disabled={loading}
          style={{
            background: '#34a853',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginBottom: '20px'
          }}
        >
          {loading ? 'Loading...' : 'Load Shops'}
        </button>

        {shops.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {shops.map((shop) => (
              <div
                key={shop.shop_id}
                style={{
                  background: 'white',
                  padding: '20px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <h3 style={{ marginTop: 0, color: '#1a73e8' }}>{shop.name}</h3>
                <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                  📍 {shop.location || 'N/A'}
                </p>
                <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                  📞 {shop.contact_phone || 'N/A'}
                </p>
                <p style={{ color: '#666', fontSize: '14px', margin: '5px 0' }}>
                  🏢 TIN: {shop.tin || 'N/A'}
                </p>
                <span style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '4px 12px',
                  background: shop.verification_status === 'approved' ? '#e6f4ea' : '#fef7e0',
                  color: shop.verification_status === 'approved' ? '#137333' : '#b06000',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {shop.verification_status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Info */}
      <div style={{ marginTop: '40px', padding: '20px', background: '#e8f0fe', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>📡 API Information</h3>
        <p style={{ margin: '5px 0' }}><strong>Base URL:</strong> {API_BASE}</p>
        <p style={{ margin: '5px 0' }}><strong>Eligibility Endpoint:</strong> GET /api/v1/supplies/eligibility</p>
        <p style={{ margin: '5px 0' }}><strong>Shops Endpoint:</strong> GET /api/v1/supplies/shops</p>
      </div>
    </div>
  );
}

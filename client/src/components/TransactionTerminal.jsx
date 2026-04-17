import React, { useState } from 'react';
import axios from 'axios';
import { CreditCard, Activity, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TransactionTerminal = ({ onSimulate, token }) => {
  const [formData, setFormData] = useState({
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    merchant: '',
    amount: ''
  });
  const [isSimulating, setIsSimulating] = useState(false);

  const formatCardNumber = (value) => {
    return value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cardNumber') {
      setFormData({ ...formData, [name]: formatCardNumber(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const executeSimulation = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.cardNumber) return alert('Please enter Card Number and Amount');
    setIsSimulating(true);

    const payload = {
      amount: parseFloat(formData.amount),
      time: Math.floor(Math.random() * 170000),
      cardLastFour: formData.cardNumber.replace(/\s/g, '').slice(-4),
      merchant: formData.merchant || 'Unknown Merchant'
    };

    // Inject mock PCA vectors for Kaggle AI format
    for (let i = 1; i <= 28; i++) {
      payload[`v${i}`] = (Math.random() * 2 - 1).toFixed(3);
    }

    try {
      const response = await axios.post(`${API_URL}/scan-transaction`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const resData = response.data;

      onSimulate({
        id: resData.transaction_id,
        time: payload.time,
        amount: payload.amount,
        cardNumber: formData.cardNumber,
        merchant: formData.merchant || 'Unknown Merchant',
        isFraud: resData.isFraud,
        riskScore: resData.riskScore,
        status: resData.status,
        method: 'Point of Sale'
      });

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        alert('Session expired. Please log in again.');
      } else if (err.response && err.response.status === 422) {
        alert('Input validation failed. Please check the values.');
      } else {
        alert('API is offline. Check backend status.');
      }
    } finally {
      setIsSimulating(false);
      setFormData({ ...formData, amount: '', merchant: '' });
    }
  };

  return (
    <div className="card" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '32px' }}>

      {/* Left: The Virtual Credit Card Visual */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--prussian-light) 0%, var(--prussian-mid) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '220px'
        }}>
          {/* Card Chip */}
          <div style={{ width: '45px', height: '35px', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', borderRadius: '6px', marginBottom: '24px' }}></div>

          <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', letterSpacing: '2px', color: '#f8fafc', textShadow: '0 2px 4px rgba(0,0,0,0.5)', marginBottom: '24px' }}>
            {formData.cardNumber || '**** **** **** ****'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
            <div>
              <div style={{ fontSize: '0.6rem', marginBottom: '4px' }}>Cardholder Name</div>
              <div style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{formData.cardholder || 'YOUR NAME'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', marginBottom: '4px' }}>Valid Thru</div>
              <div style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{formData.expiry || 'MM/YY'}</div>
            </div>
          </div>

          <Shield size={120} color="var(--border-color)" style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.5 }} />
        </div>
      </div>

      {/* Right: The POS Form */}
      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', marginBottom: '8px' }}>
          <Activity size={20} color="var(--teal-bright)" /> Virtual POS Terminal
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
          Simulate a real-time swipe. The engine will extract the anomaly vectors and score the transaction risk instantly.
        </p>

        <form onSubmit={executeSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div className="input-grid">
            <div className="input-group">
              <label>Cardholder Name</label>
              <input type="text" name="cardholder" className="input-field" placeholder="John Doe" value={formData.cardholder} onChange={handleInputChange} />
            </div>
            <div className="input-group">
              <label>Merchant Name</label>
              <input type="text" name="merchant" className="input-field" placeholder="e.g. Apple Store" value={formData.merchant} onChange={handleInputChange} />
            </div>
          </div>

          <div className="input-group">
            <label>Card Number</label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input type="text" name="cardNumber" className="input-field" placeholder="0000 0000 0000 0000" style={{ paddingLeft: '40px' }} value={formData.cardNumber} onChange={handleInputChange} maxLength="19" />
            </div>
          </div>

          <div className="input-grid">
            <div className="input-group">
              <label>Expiry (MM/YY)</label>
              <input type="text" name="expiry" className="input-field" placeholder="12/25" value={formData.expiry} onChange={handleInputChange} maxLength="5" />
            </div>
            <div className="input-group">
              <label>CVV Number</label>
              <input type="password" name="cvv" className="input-field" placeholder="***" value={formData.cvv} onChange={handleInputChange} maxLength="4" />
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Transaction Amount (₦)</label>
              <input type="number" name="amount" className="input-field" placeholder="e.g. 500.00" value={formData.amount} onChange={handleInputChange} style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }} />
            </div>

            <button type="submit" className="btn" disabled={isSimulating} style={{ padding: '12px 24px', fontSize: '1rem' }}>
              {isSimulating ? 'Processing...' : 'Process Payment'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TransactionTerminal;

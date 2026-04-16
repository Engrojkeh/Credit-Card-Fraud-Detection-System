import React from 'react';
import { AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';

const DataTable = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
        No transactions have been analyzed yet. Upload a CSV or process a payment via POS.
      </div>
    );
  }

  // Mask card helper
  const maskCard = (num) => {
    if (!num) return '**** **** **** 0000';
    return `**** **** **** ${num.slice(-4)}`;
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Fraud Profile</th>
            <th>Type</th>
            <th>Card Details</th>
            <th>Merchant / ID</th>
            <th>Amount</th>
            <th>Risk Engine Score</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, idx) => (
            <tr key={`${tx.id}-${idx}`}>
              <td>
                {tx.isFraud ? (
                  <span className="badge badge-fraud" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} /> FRAUD RISK
                  </span>
                ) : (
                  <span className="badge badge-safe" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> SECURE
                  </span>
                )}
              </td>
              <td>{tx.method}</td>
              <td style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <CreditCard size={14} /> 
                {maskCard(tx.cardNumber)}
              </td>
              <td style={{ fontFamily: 'monospace', color: '#58a6ff' }}>
                {tx.merchant ? tx.merchant : tx.id}
              </td>
              <td style={{ fontWeight: 600 }}>
                ₦{parseFloat(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td style={{ color: tx.isFraud ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 600 }}>
                {tx.riskScore}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

import React from 'react';
import { ShieldAlert, ActivitySquare, BadgeDollarSign } from 'lucide-react';

const OverviewStats = ({ transactions }) => {
  const totalScanned = transactions.length;
  const totalFraud = transactions.filter(tx => tx.isFraud).length;
  const moneySaved = transactions
    .filter(tx => tx.isFraud)
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
      
      {/* Total Scanned */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px' }}>
        <div style={{ background: 'rgba(88, 166, 255, 0.1)', padding: '16px', borderRadius: '12px' }}>
          <ActivitySquare size={28} color="#58a6ff" />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Transactions Scanned
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
            {totalScanned}
          </div>
        </div>
      </div>

      {/* Fraud Prevented */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px' }}>
        <div style={{ background: 'var(--danger-bg)', padding: '16px', borderRadius: '12px', boxShadow: '0 0 15px rgba(248, 81, 73, 0.2)' }}>
          <ShieldAlert size={28} color="var(--danger)" />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fraud Stopped
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
            {totalFraud}
          </div>
        </div>
      </div>

      {/* Money Saved */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px' }}>
        <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '12px' }}>
          <BadgeDollarSign size={28} color="var(--success)" />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Money Saved
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
            ₦{moneySaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default OverviewStats;

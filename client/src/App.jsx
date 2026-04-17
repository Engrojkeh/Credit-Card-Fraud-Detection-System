import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, LogOut } from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import TransactionTerminal from './components/TransactionTerminal';
import UploadComponent from './components/UploadComponent';
import DataTable from './components/DataTable';
import MetricsCard from './components/MetricsCard';
import OverviewStats from './components/OverviewStats';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('aegis_token');
    const savedUser = localStorage.getItem('aegis_user');
    if (savedToken && savedUser) {
      setAuthToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (token, user) => {
    setAuthToken(token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('aegis_token');
    localStorage.removeItem('aegis_user');
    setAuthToken(null);
    setCurrentUser(null);
    setTransactions([]);
  };

  // Real-time hook for terminal
  const handleNewTransaction = (transactionData) => {
    setTransactions((prev) => [transactionData, ...prev]);
  };

  // Batch hook for CSV
  const handleBatchResults = (batchData) => {
    setTransactions((prev) => [...batchData, ...prev].slice(0, 500));
  };

  // ── GATE: Show login if no token ──
  if (!authToken) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // ── DASHBOARD: Authenticated view ──
  return (
    <>
      <nav className="navbar">
        <div className="brand">
          <ShieldCheck size={28} color="#8aab9e" />
          Aegis Fraud Detection Core
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.85rem' }}>
            <Server size={16}/>
            <span style={{ color: '#8aab9e', fontWeight: 600 }}>{currentUser?.username}</span>
            &bull; Administrator
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = 'var(--danger)'; e.target.style.color = 'var(--danger)'; }}
            onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </nav>

      <main className="dashboard-grid">
        <aside className="sidebar">
          <MetricsCard />
          <UploadComponent onBatchUpload={handleBatchResults} token={authToken} />
        </aside>

        <section className="main-content">
          <OverviewStats transactions={transactions} />
          <TransactionTerminal onSimulate={handleNewTransaction} token={authToken} />
          
          <div className="card">
            <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Real-Time Inference Log</h2>
            <DataTable transactions={transactions} />
          </div>
        </section>
      </main>
    </>
  );
}

export default App;

import React, { useState } from 'react';
import { ShieldCheck, Server } from 'lucide-react';
import TransactionTerminal from './components/TransactionTerminal';
import UploadComponent from './components/UploadComponent';
import DataTable from './components/DataTable';
import MetricsCard from './components/MetricsCard';
import OverviewStats from './components/OverviewStats';

function App() {
  const [transactions, setTransactions] = useState([]);
  
  // Real-time hook for terminal
  const handleNewTransaction = (transactionData) => {
    setTransactions((prev) => [transactionData, ...prev]);
  };

  // Batch hook for CSV
  const handleBatchResults = (batchData) => {
    // Merge new batch with existing transactions (limit to 100 for perf in memory)
    setTransactions((prev) => [...batchData, ...prev].slice(0, 500));
  };

  return (
    <>
      <nav className="navbar">
        <div className="brand">
          <ShieldCheck size={28} color="#58a6ff" />
          Aegis Fraud Detection Core
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.85rem' }}>
          <Server size={16}/> Node.js / TF.js Engine Offline
        </div>
      </nav>

      <main className="dashboard-grid">
        <aside className="sidebar">
          <MetricsCard />
          <UploadComponent onBatchUpload={handleBatchResults} />
        </aside>

        <section className="main-content">
          <OverviewStats transactions={transactions} />
          
          <TransactionTerminal onSimulate={handleNewTransaction} />
          
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

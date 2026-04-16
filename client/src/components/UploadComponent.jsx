import React, { useRef, useState } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UploadComponent = ({ onBatchUpload, token }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert("Please upload a valid CSV file");
        return;
    }

    setIsUploading(true);
    setStats(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // POST to Node.js backend with JWT Authorization header
      const res = await axios.post(`${API_URL}/upload-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = res.data;
      
      setStats({
          scanned: data.scannedRows,
          fraud: data.totalFraudDetected
      });

      // Pass the flagged transactions back to App for rendering
      onBatchUpload(data.flaggedTransactions.map((tx, idx) => ({
          id: tx.transaction_id || `BATCH-${idx}`,
          time: tx.Time || tx.time,
          amount: tx.Amount || tx.amount,
          isFraud: tx.isFraud,
          riskScore: tx.riskScore,
          status: tx.status,
          method: 'CSV Batch'
      })));

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        alert('Session expired. Please log in again.');
      } else {
        alert('Error uploading CSV. Is the backend running?');
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
         Batch CSV Analyzer
      </h3>
      
      <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
        <UploadCloud size={40} color="var(--text-secondary)" style={{ marginBottom: '12px' }}/>
        <p style={{ margin: 0, fontWeight: 500 }}>
            {isUploading ? 'Analyzing CSV Tensor Batch...' : 'Drag & Drop CSV Dataset'}
        </p>
        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '8px' }}>
            Historical bulk scan
        </small>
      </div>

      {stats && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Batch Results</div>
              <div style={{ fontWeight: 600, color: '#fff', marginTop: '4px' }}>
                  Scanned: {stats.scanned} rows
              </div>
              <div style={{ fontWeight: 600, color: 'var(--danger)' }}>
                  Fraud Detected: {stats.fraud}
              </div>
          </div>
      )}
    </div>
  );
};

export default UploadComponent;

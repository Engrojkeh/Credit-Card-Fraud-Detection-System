import React from 'react';
import { BrainCircuit } from 'lucide-react';

const MetricsCard = () => {
  return (
    <div className="card" style={{ background: 'linear-gradient(145deg, var(--prussian-light) 0%, var(--prussian) 100%)' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--teal-bright)' }}>
        <BrainCircuit size={20} /> AI Model Performance
      </h3>
      
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
        Based on Offline Python Training (TensorFlow + SMOTE applied on unbalanced Kaggle Dataset).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             Validation F1-Score
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#e8f0ec' }}>0.874</div>
        </div>
        
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             AUC-ROC Metric
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#e8f0ec' }}>0.981</div>
        </div>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }}></div>

        <div style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px rgba(74, 222, 128, 0.5)' }}></div>
          TF.js Inference Engine Active
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;

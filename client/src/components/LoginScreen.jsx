import React, { useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Lock, User, AlertCircle, Loader2, Fingerprint } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      const { token, user } = response.data;
      localStorage.setItem('aegis_token', token);
      localStorage.setItem('aegis_user', JSON.stringify(user));
      onLoginSuccess(token, user);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Invalid credentials. Access denied.');
      } else {
        setError('Server is unreachable. Please ensure the backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated Background Elements */}
      <div className="login-bg-grid"></div>
      <div className="login-bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>

      {/* Floating Data Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              opacity: 0.1 + Math.random() * 0.3
            }}
          />
        ))}
      </div>

      {/* Scanning Line Animation */}
      <div className="scan-line"></div>

      {/* Login Card */}
      <div className="login-card">
        {/* Glowing Top Border */}
        <div className="login-card-glow"></div>

        {/* Logo Area */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="login-logo">
            <div className="login-logo-ring"></div>
            <ShieldCheck size={32} color="#fff" />
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Aegis Fraud Detection
          </h1>
          <p style={{ color: '#708D81', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Administrator Authentication Required
          </p>
        </div>

        {/* Biometric Decoration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '12px 16px', background: 'rgba(112, 141, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(112, 141, 129, 0.15)' }}>
          <Fingerprint size={20} color="#708D81" />
          <span style={{ color: '#708D81', fontSize: '0.8rem' }}>Secure multi-factor session. All access is logged and monitored.</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div className="login-input-group">
            <label>
              <User size={13} /> Username
            </label>
            <input
              type="text"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="login-input-group">
            <label>
              <Lock size={13} /> Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 size={18} className="spin" /> Authenticating...</>
            ) : (
              <>Sign In to Dashboard</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(112, 141, 129, 0.15)',
          textAlign: 'center',
          color: 'rgba(112, 141, 129, 0.6)',
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Protected by JWT &bull; Helmet &bull; Rate-Limited API &bull; TFjs-SMOTE v2.1
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

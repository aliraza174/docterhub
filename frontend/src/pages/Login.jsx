import React, { useState } from 'react';
import { api } from '../utils/api';
import { Heart, Key, Mail, Sparkles, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

export function Login({ onLoginSuccess, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password sub-flow
  const [forgotFlow, setForgotFlow] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMsg('');
    setLoading(true);

    try {
      const res = await api.forgotPassword(forgotEmail, newPassword);
      setForgotMsg(res.message);
      setTimeout(() => {
        setForgotFlow(false);
        setForgotMsg('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Reset password failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 20%, rgba(255, 46, 147, 0.08), transparent 40%), var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }} className="fade-in">
      <div style={{ width: '100%', maxWidth: '440px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', cursor: 'pointer' }} onClick={() => onNavigate('landing')}>
          <div style={{
            display: 'inline-flex',
            background: 'var(--accent-gradient)',
            color: '#fff',
            padding: '10px',
            borderRadius: '12px',
            marginBottom: '12px',
            boxShadow: '0 4px 15px rgba(255, 46, 147, 0.2)'
          }}>
            <Heart fill="#fff" size={24} />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>Welcome to Doctor Hub</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Holistic Healthcare Consultation Portal</p>
        </div>

        {/* Auth Box */}
        <div className="card glass-panel" style={{ padding: '36px' }}>
          
          {error && (
            <div style={{
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {forgotMsg && (
            <div style={{
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '20px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <span>{forgotMsg}</span>
            </div>
          )}

          {!forgotFlow ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="form-control"
                    style={{ paddingLeft: '48px' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '16px', top: '18px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    placeholder="Enter account password"
                    className="form-control"
                    style={{ paddingLeft: '48px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Forgot password trigger */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <button
                  type="button"
                  onClick={() => setForgotFlow(true)}
                  style={{ fontSize: '13px', color: 'var(--accent-pink)', fontWeight: '500', cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit}>
              <button
                type="button"
                onClick={() => setForgotFlow(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', cursor: 'pointer' }}
              >
                <ArrowLeft size={14} /> Back to login
              </button>

              <div className="form-group">
                <label className="form-label">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="form-control"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Create new password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', gap: '8px' }}
              >
                {loading ? <RefreshCw className="pulse-glow" size={16} /> : null}
                Reset Password
              </button>
            </form>
          )}

          {/* Switch to Register */}
          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('register')}
              style={{ color: 'var(--accent-pink)', fontWeight: '600', cursor: 'pointer' }}
            >
              Sign up
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

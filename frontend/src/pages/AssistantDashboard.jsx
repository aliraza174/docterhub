import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Check, X, CreditCard, Calendar, User, Eye, EyeOff } from 'lucide-react';

export function AssistantDashboard({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  
  // Modal for previewing receipts
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  useEffect(() => {
    loadAssistantPayments();
  }, []);

  const loadAssistantPayments = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const pendingData = await api.getAssistantPayments();
      setPayments(pendingData || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch pending payments. Please verify doctor assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId, decision) => {
    setVerifyMsg('');
    try {
      const res = await api.verifyPayment(paymentId, decision);
      setVerifyMsg(`Success: Payment has been ${decision}!`);
      setPreviewScreenshot(null);
      loadAssistantPayments();
      setTimeout(() => setVerifyMsg(''), 2500);
    } catch (err) {
      setVerifyMsg(err.message || 'Action failed.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '80px', marginBottom: '20px' }}></div>
        <div className="skeleton" style={{ height: '300px' }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout fade-in">
      <div className="dashboard-content">
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Assistant Verification Desk</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome, {user.name}. Audit client deposit receipts and authorize doctor bookings.</p>
        </div>

        {errorMsg ? (
          <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-danger)', fontSize: '15px' }}>{errorMsg}</p>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Pending Deposit Approvals</h3>
            
            {verifyMsg && (
              <div style={{
                color: 'var(--color-success)',
                background: 'var(--color-success-bg)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                marginBottom: '20px',
                textAlign: 'center'
              }} className="slide-up">
                {verifyMsg}
              </div>
            )}

            {payments.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No pending payments to review at this moment.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Time Slot</th>
                      <th>Fee Amount</th>
                      <th>Screenshot Receipt</th>
                      <th>Submission Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.payment_id}>
                        <td>
                          <strong>{p.patient_name}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>{p.patient_email}</span>
                        </td>
                        <td>
                          <strong>{p.date}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>{p.time_slot}</span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--accent-pink)' }}>${p.amount}</strong>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                            onClick={() => setPreviewScreenshot(p.payment_screenshot)}
                          >
                            <Eye size={12} /> Inspect Image
                          </button>
                        </td>
                        <td>
                          <span className="badge badge-warning">Awaiting Audit</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-primary"
                              style={{ background: 'var(--color-success)', color: '#fff', padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleVerify(p.payment_id, 'verified')}
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleVerify(p.payment_id, 'rejected')}
                            >
                              <X size={13} /> Decline
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Screenshot Previewer */}
      {previewScreenshot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }} className="fade-in">
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px' }}>Receipt Screenshot Preview</h3>
              <button 
                onClick={() => setPreviewScreenshot(null)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{
              background: '#000',
              padding: '12px',
              borderRadius: '8px',
              maxHeight: '350px',
              overflowY: 'auto',
              marginBottom: '20px',
              border: '1px solid var(--border-subtle)'
            }}>
              <img
                src={previewScreenshot}
                alt="Payment proof screenshot"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
              />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Confirm the transfer amount matches the requested fee before clicking approve.</p>
          </div>
        </div>
      )}
    </div>
  );
}

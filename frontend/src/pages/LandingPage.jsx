import React from 'react';
import { Heart, Activity, ShieldCheck, Sparkles, ArrowRight, UserPlus, LogIn, Award } from 'lucide-react';

export function LandingPage({ onNavigate }) {
  return (
    <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(5, 5, 8, 0.75)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--accent-gradient)', color: '#fff', padding: '8px', borderRadius: '10px', display: 'flex' }}>
              <Heart fill="#fff" size={20} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'var(--font-heading)' }}>Doctor Hub</h1>
          </div>
          
          <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => onNavigate('login')} style={{ padding: '8px 18px', fontSize: '13px' }}>
              <LogIn size={15} /> Sign In
            </button>
            <button className="btn btn-primary" onClick={() => onNavigate('register')} style={{ padding: '8px 18px', fontSize: '13px' }}>
              <UserPlus size={15} /> Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Framer-Style Hero Section */}
      <section style={{ position: 'relative', width: '100%' }}>
        <div className="container hero-layout">
          
          {/* Hero Left Side: Overlapping Text and Rocket */}
          <div className="hero-text-side">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 46, 147, 0.06)',
              border: '1px solid rgba(255, 46, 147, 0.15)',
              padding: '6px 16px',
              borderRadius: '9999px',
              color: 'var(--accent-pink)',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '20px',
              fontFamily: 'var(--font-heading)'
            }}>
              <Sparkles size={13} /> Secure Consultation Pipeline
            </div>

            {/* Overlapping massive typography */}
            <h2 className="mega-title">
              D<span className="rotated-letter-badge">
                <Heart fill="#fff" stroke="none" size={24} />
              </span>ctor Hub <br />
              Heal & <br />
              <span className="gradient-text">Prescribe</span>
            </h2>

            <p style={{
              fontSize: '17px',
              color: 'var(--text-secondary)',
              marginBottom: '36px',
              lineHeight: '1.6',
              maxWidth: '520px'
            }}>
              Connect with certified Allopathic, Homeopathic, and Herbal doctors. Book slots, upload screenshots, and audit your medical history securely under encryption.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => onNavigate('register')} style={{ padding: '14px 32px', fontSize: '15px' }}>
                Book Appointment <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={() => onNavigate('login')} style={{ padding: '14px 32px', fontSize: '15px' }}>
                Audit History
              </button>
            </div>
          </div>

          {/* Hero Right Side: Floating Device Mockup showing patient dashboard & Orbiting Rocket */}
          <div className="hero-visual-side">
            {/* Glowing Aura Backplate */}
            <div className="hero-visual-backplate"></div>

            <div className="device-frame">
              <div className="device-screen-glare"></div>
              
              {/* Dynamic Phone Layout */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
                
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100"
                      alt=""
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid var(--accent-pink)' }}
                    />
                    <div>
                      <h5 style={{ fontSize: '11px', fontWeight: '800' }}>Sophia Bennett</h5>
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Patient Profile</span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '8px', padding: '2px 8px' }}>Verified</span>
                </div>

                {/* Consultation Card */}
                <div className="card-highlight" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--accent-pink)', fontWeight: '600' }}>Today's Consult</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                      <Activity size={10} style={{ color: 'var(--color-success)' }} />
                      <span>Live Track</span>
                    </div>
                  </div>
                  <h6 style={{ fontSize: '12px', fontWeight: '700' }}>Dr. Sarah Jenkins</h6>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Allopathic Cardiology</p>
                  <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>Suite 404, Med Center East</p>
                </div>

                {/* Mini chart visual inside screen */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Vitals Tracker (BPM)</span>
                  <svg width="100%" height="40" viewBox="0 0 100 40">
                    <path d="M 0 30 Q 15 10 30 25 T 60 15 T 90 28 L 100 28" fill="none" stroke="var(--accent-pink)" strokeWidth="2" />
                    <circle cx="60" cy="15" r="3" fill="var(--accent-pink)" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)' }}>
                    <span>09:00 AM</span>
                    <span>72 BPM (Normal)</span>
                  </div>
                </div>

                {/* History list inside phone */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Medical Logs</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '10px', fontSize: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <span>Prescription.pdf</span>
                    <span style={{ color: 'var(--color-success)' }}>Completed</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '10px', fontSize: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <span>BloodTest_June.png</span>
                    <span style={{ color: 'var(--color-info)' }}>Uploaded</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Overlapping Rocket orbiting the visual side rather than text */}
            <div className="rocket-launch-path" style={{ pointerEvents: 'none' }}>
              <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="fireGrad2" x1="100" y1="180" x2="100" y2="120" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ff2e93" stopOpacity="0" />
                    <stop offset="40%" stopColor="#ff2e93" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffae00" />
                  </linearGradient>
                  <linearGradient id="rocketBodyGrad2" x1="100" y1="40" x2="100" y2="130" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#a1a1aa" />
                  </linearGradient>
                </defs>
                <path d="M 90 130 Q 75 180 100 220 Q 125 180 110 130 Z" fill="url(#fireGrad2)" />
                <circle cx="100" cy="180" r="14" fill="#ff2e93" filter="blur(6px)" opacity="0.8" />
                <rect x="85" y="40" width="30" height="90" rx="15" fill="url(#rocketBodyGrad2)" stroke="#1f2937" strokeWidth="2" />
                <path d="M 85 95 L 65 125 L 85 120 Z" fill="#8f00ff" stroke="#1f2937" strokeWidth="2" />
                <path d="M 115 95 L 135 125 L 115 120 Z" fill="#8f00ff" stroke="#1f2937" strokeWidth="2" />
                <circle cx="100" cy="75" r="10" fill="var(--bg-primary)" stroke="var(--accent-pink)" strokeWidth="2" />
                <line x1="100" y1="70" x2="100" y2="80" stroke="var(--accent-pink)" strokeWidth="2" />
                <line x1="95" y1="75" x2="105" y2="75" stroke="var(--accent-pink)" strokeWidth="2" />
              </svg>
            </div>
          </div>

        </div>
      </section>

      {/* Active Stats Section */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--border-subtle)', background: 'rgba(5, 5, 8, 0.5)' }}>
        <div className="container">
          <div className="grid-3" style={{ textAlign: 'center' }}>
            <div>
              <div className="gradient-text" style={{ fontSize: '42px', fontWeight: '900', fontFamily: 'var(--font-heading)' }}>99.6%</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Certified Specialists</p>
            </div>
            <div>
              <div className="gradient-text" style={{ fontSize: '42px', fontWeight: '900', fontFamily: 'var(--font-heading)' }}>99.2%</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Consultations</p>
            </div>
            <div>
              <div className="gradient-text" style={{ fontSize: '42px', fontWeight: '900', fontFamily: 'var(--font-heading)' }}>99.8%</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Trust Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Treatment Modalities */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--border-subtle)', position: 'relative' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h3 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '12px' }}>Holistic Practice Specialties</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Select the healing methodology appropriate to your clinical needs</p>
          </div>

          <div className="grid-3">
            <div className="card glass-panel" style={{ padding: '32px' }}>
              <span style={{ fontSize: '10px', color: 'var(--accent-pink)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Traditional Science</span>
              <h4 style={{ fontSize: '22px', margin: '8px 0 16px 0' }}>Allopathic Care</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', minHeight: '80px' }}>
                Evidence-based diagnostics and surgical/pharmaceutical interventions. Recommended for acute checks, cardiology, and immediate primary treatment.
              </p>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                Specialists: Cardiology, Infectious disease, General medicine
              </div>
            </div>

            <div className="card glass-panel" style={{ padding: '32px' }}>
              <span style={{ fontSize: '10px', color: 'var(--accent-pink)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Constitutional Healing</span>
              <h4 style={{ fontSize: '22px', margin: '8px 0 16px 0' }}>Homeopathic Remedy</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', minHeight: '80px' }}>
                Gentle natural remedies to stimulate the body's constitutional self-regulation. Recommended for allergies, arthritis, eczema, and asthma.
              </p>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                Specialists: Chronic dermatitis, Asthma, Inflammatory arthritis
              </div>
            </div>

            <div className="card glass-panel" style={{ padding: '32px' }}>
              <span style={{ fontSize: '10px', color: 'var(--accent-pink)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Botanical Balance</span>
              <h4 style={{ fontSize: '22px', margin: '8px 0 16px 0' }}>Herbal Wellness</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', minHeight: '80px' }}>
                Organic plant-derived therapies, wellness teas, and dietary balance. Focuses on stress recovery, insomnia remedies, and acid indigestion.
              </p>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                Specialists: Insomnia sleep aids, Gastro dyspepsia, Anxiety relief
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(5, 5, 8, 0.9)',
        padding: '40px 0',
        fontSize: '14px',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            <Heart fill="var(--accent-pink)" size={16} stroke="none" />
            <strong style={{ color: '#fff' }}>Doctor Hub Network</strong>
          </div>
          <p>© 2026 Doctor Hub. All rights reserved. Secure Encrypted Health Record System.</p>
        </div>
      </footer>

    </div>
  );
}

import React, { useState } from 'react';
import { api } from '../utils/api';
import { Heart, User, Mail, Key, ShieldAlert, CheckCircle, ArrowRight } from 'lucide-react';

export function Register({ onNavigate }) {
  // Common states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  
  // Patient details
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('A-Positive');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Doctor details
  const [specialty, setSpecialty] = useState('Allopathic');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [fees, setFees] = useState('');
  const [diseaseFocus, setDiseaseFocus] = useState('');

  // Status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      name,
      email,
      password,
      role
    };

    if (role === 'patient') {
      payload.age = parseInt(age) || null;
      payload.gender = gender;
      payload.blood_group = bloodGroup;
      payload.emergency_contact = emergencyContact;
    } else if (role === 'doctor') {
      payload.specialty = specialty;
      payload.experience = parseInt(experience) || 0;
      payload.bio = bio;
      payload.fees = parseFloat(fees) || 0;
      payload.disease_focus = diseaseFocus;
    }

    try {
      await api.register(payload);
      setSuccess(true);
      setTimeout(() => {
        onNavigate('login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 90% 20%, rgba(255, 46, 147, 0.08), transparent 40%), var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px'
    }} className="fade-in">
      <div style={{ width: '100%', maxWidth: '520px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px', cursor: 'pointer' }} onClick={() => onNavigate('landing')}>
          <div style={{
            display: 'inline-flex',
            background: 'var(--accent-gradient)',
            color: '#fff',
            padding: '10px',
            borderRadius: '12px',
            marginBottom: '10px'
          }}>
            <Heart fill="#fff" size={24} />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Join the holistically synchronized network</p>
        </div>

        {/* Box */}
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

          {success ? (
            <div style={{
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }} className="slide-up">
              <CheckCircle size={44} style={{ color: 'var(--color-success)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Registration Successful!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your account has been created. Redirecting to Login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {/* User Role Selection */}
              <div className="form-group">
                <label className="form-label">I want to register as a:</label>
                <select 
                  className="form-control" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  style={{ fontWeight: '600' }}
                >
                  <option value="patient">Patient (Book Appointments, Upload Receipts)</option>
                  <option value="doctor">Medical Doctor (Consult and Prescribe)</option>
                  <option value="assistant">Medical Assistant (Verify Payments)</option>
                </select>
              </div>

              {/* Common Fields */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Create secure password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Role-Specific Patient Form */}
              {role === 'patient' && (
                <div className="slide-up" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--accent-pink)', marginBottom: '16px', textTransform: 'uppercase' }}>Patient Medical Details</h4>
                  
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Age</label>
                      <input
                        type="number"
                        placeholder="Age"
                        className="form-control"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Blood Group</label>
                      <select className="form-control" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                        <option value="A-Positive">A+</option>
                        <option value="A-Negative">A-</option>
                        <option value="B-Positive">B+</option>
                        <option value="B-Negative">B-</option>
                        <option value="AB-Positive">AB+</option>
                        <option value="AB-Negative">AB-</option>
                        <option value="O-Positive">O+</option>
                        <option value="O-Negative">O-</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Emergency Contact</label>
                      <input
                        type="text"
                        placeholder="Phone number"
                        className="form-control"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Role-Specific Doctor Form */}
              {role === 'doctor' && (
                <div className="slide-up" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', marginTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--accent-pink)', marginBottom: '16px', textTransform: 'uppercase' }}>Professional Practice Profile</h4>
                  
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Treatment Type</label>
                      <select className="form-control" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                        <option value="Allopathic">Allopathic (Traditional/Surgical)</option>
                        <option value="Homeopathic">Homeopathic (Dilutions/Holistic)</option>
                        <option value="Herbal">Herbal (Botanical/Organic)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Consultation Fees ($)</label>
                      <input
                        type="number"
                        required
                        placeholder="Fee amount"
                        className="form-control"
                        value={fees}
                        onChange={(e) => setFees(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Experience (Years)</label>
                      <input
                        type="number"
                        placeholder="Years of practice"
                        className="form-control"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Disease Focus (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Flu, Migraine, Eczema"
                        className="form-control"
                        value={diseaseFocus}
                        onChange={(e) => setDiseaseFocus(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Short Biography</label>
                    <textarea
                      placeholder="Briefly state your qualifications and medical experience..."
                      className="form-control"
                      rows="3"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px' }}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </form>
          )}

          {/* Switch to Login */}
          {!success && (
            <div style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                style={{ color: 'var(--accent-pink)', fontWeight: '600', cursor: 'pointer' }}
              >
                Log In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Activity, Sparkles, AlertTriangle, ArrowRight, CheckCircle, RefreshCw, Calendar } from 'lucide-react';

export function AIHeuristicPredictor({ doctors = [], onSelectDoctor }) {
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState('moderate');
  const [duration, setDuration] = useState('4-7 days');
  const [result, setResult] = useState(null);

  const symptomList = [
    { id: 'chest_pain', label: 'Chest Pain or tightness' },
    { id: 'shortness_breath', label: 'Shortness of Breath' },
    { id: 'fever', label: 'Fever or chills' },
    { id: 'cough', label: 'Persistent Cough' },
    { id: 'skin_rash', label: 'Skin Rash or eczema' },
    { id: 'joint_pain', label: 'Joint Pain or stiffness' },
    { id: 'stress', label: 'Anxiety or High Stress' },
    { id: 'insomnia', label: 'Insomnia / Sleep troubles' },
    { id: 'indigestion', label: 'Acid reflux or Indigestion' },
    { id: 'migraine', label: 'Severe Headaches or Migraines' }
  ];

  const toggleSymptom = (id) => {
    if (selectedSymptoms.includes(id)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, id]);
    }
  };

  const handleTriage = () => {
    // Basic AI Triage Rule Logic
    let primarySpecialty = 'Allopathic';
    let predictedCondition = 'General Fatigue / Seasonal malaise';
    let urgency = 'Routine';
    let confidence = 65;

    const hasUrgent = selectedSymptoms.includes('chest_pain') || selectedSymptoms.includes('shortness_breath');
    const hasSkinOrJoint = selectedSymptoms.includes('skin_rash') || selectedSymptoms.includes('joint_pain');
    const hasStressOrSleep = selectedSymptoms.includes('stress') || selectedSymptoms.includes('insomnia') || selectedSymptoms.includes('indigestion');

    if (hasUrgent) {
      primarySpecialty = 'Allopathic';
      predictedCondition = 'Cardiovascular Strain or Respiratory Congestion';
      urgency = severity === 'severe' ? 'Urgent (Seek Clinic Promptly)' : 'Semi-Urgent';
      confidence = 88;
    } else if (hasSkinOrJoint) {
      primarySpecialty = 'Homeopathic';
      predictedCondition = selectedSymptoms.includes('skin_rash') 
        ? 'Allergic Dermatitis / Eczema flareup' 
        : 'Chronic Inflammatory Arthritis';
      urgency = 'Routine Consultation';
      confidence = 79;
    } else if (hasStressOrSleep) {
      primarySpecialty = 'Herbal';
      predictedCondition = selectedSymptoms.includes('stress')
        ? 'Nervous Overload & Insomnia'
        : 'Functional Gastrointestinal Dyspepsia';
      urgency = 'Holistic / Lifestyle Support';
      confidence = 82;
    } else if (selectedSymptoms.includes('fever') || selectedSymptoms.includes('cough')) {
      primarySpecialty = 'Allopathic';
      predictedCondition = 'Acute Viral Bronchitis / Seasonal Infection';
      urgency = 'Routine Consultation';
      confidence = 72;
    }

    // Filter recommended doctors
    const recommendedDocs = doctors.filter(doc => doc.specialty === primarySpecialty);

    setResult({
      primarySpecialty,
      predictedCondition,
      urgency,
      confidence,
      recommendedDocs
    });
    setStep(3);
  };

  const resetTriage = () => {
    setSelectedSymptoms([]);
    setSeverity('moderate');
    setDuration('4-7 days');
    setResult(null);
    setStep(1);
  };

  return (
    <div className="card glass-panel fade-in" style={{ padding: '30px', border: '1px solid var(--border-active)' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{
          background: 'var(--accent-gradient)',
          padding: '8px',
          borderRadius: '10px',
          color: '#fff',
          display: 'flex'
        }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '20px' }}>AI Symptom Checker & Specialty Predictor</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Identify probable conditions and find matching doctors instantly</p>
        </div>
      </div>

      {step === 1 && (
        <div className="slide-up">
          <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Step 1: Select all symptoms you are currently experiencing:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {symptomList.map(sym => (
              <label
                key={sym.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: selectedSymptoms.includes(sym.id) ? 'rgba(255, 46, 147, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: selectedSymptoms.includes(sym.id) ? '1px solid var(--accent-pink)' : '1px solid var(--border-subtle)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSymptoms.includes(sym.id)}
                  onChange={() => toggleSymptom(sym.id)}
                  style={{
                    accentColor: 'var(--accent-pink)',
                    width: '16px',
                    height: '16px'
                  }}
                />
                <span style={{ fontSize: '14px', color: selectedSymptoms.includes(sym.id) ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {sym.label}
                </span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              disabled={selectedSymptoms.length === 0}
              onClick={() => setStep(2)}
              style={{ opacity: selectedSymptoms.length === 0 ? 0.5 : 1 }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="slide-up">
          <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Step 2: Provide severity and duration parameters:
          </h4>

          <div className="form-group">
            <label className="form-label">Symptom Severity</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['mild', 'moderate', 'severe'].map(s => (
                <button
                  key={s}
                  type="button"
                  className={`btn ${severity === s ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                  onClick={() => setSeverity(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">Duration</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['1-3 days', '4-7 days', '1+ weeks'].map(d => (
                <button
                  key={d}
                  type="button"
                  className={`btn ${duration === d ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setDuration(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn btn-primary" onClick={handleTriage}>
              Predict Specialty & Matches <Activity size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="slide-up">
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h4 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Analysis Complete</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {result.predictedCondition}
              </span>
              <span className="badge badge-info" style={{ fontSize: '13px' }}>
                {result.confidence}% Confidence
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', fontSize: '14px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recommended System:</span>
                <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '12px' }}>
                  {result.primarySpecialty} Medicine
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '14px', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Priority:</span>
                <span style={{
                  color: result.urgency.includes('Urgent') ? 'var(--color-danger)' : 'var(--color-warning)',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {result.urgency.includes('Urgent') && <AlertTriangle size={14} />}
                  {result.urgency}
                </span>
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '14px' }}>
            Recommended {result.primarySpecialty} Doctors:
          </h4>

          {result.recommendedDocs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic', marginBottom: '20px' }}>
              No specific doctors of this specialty found in seed records. Browse the full doctor directory to schedule manually.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {result.recommendedDocs.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    padding: '16px',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={doc.avatar_url}
                      alt={doc.name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h5 style={{ fontSize: '15px' }}>{doc.name}</h5>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {doc.experience} Yrs Exp • Focus: {doc.disease_focus?.split(',').slice(0, 2).join(', ')}...
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                    onClick={() => onSelectDoctor(doc)}
                  >
                    Book Slot <Calendar size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={resetTriage}>
              <RefreshCw size={14} /> Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

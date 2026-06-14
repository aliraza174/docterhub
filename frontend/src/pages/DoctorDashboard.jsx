import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Settings, 
  Users, 
  Search, 
  X,
  PlusSquare,
  ShieldCheck
} from 'lucide-react';

export function DoctorDashboard({ user, activeTab, setActiveTab }) {
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clinic editing state
  const [editingClinic, setEditingClinic] = useState(null);
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicSchedule, setClinicSchedule] = useState({});
  const [clinicMsg, setClinicMsg] = useState('');

  // Prescription modal
  const [prescAppointment, setPrescAppointment] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '' }]);
  const [prescMsg, setPrescMsg] = useState('');

  // Patient Audit state
  const [searchPatientId, setSearchPatientId] = useState('');
  const [auditedPatient, setAuditedPatient] = useState(null);
  const [auditedTimeline, setAuditedTimeline] = useState([]);
  const [auditMsg, setAuditMsg] = useState('');

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctorDashboard();
      setAppointments(data.appointments || []);
      setClinics(data.clinics || []);
      setAssistant(data.assistant);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Clinic edit handler
  const handleClinicEdit = (clinic) => {
    setEditingClinic(clinic);
    setClinicName(clinic.name);
    setClinicAddress(clinic.address);
    try {
      setClinicSchedule(JSON.parse(clinic.schedule) || {});
    } catch (e) {
      setClinicSchedule({});
    }
  };

  const handleClinicUpdateSubmit = async (e) => {
    e.preventDefault();
    setClinicMsg('');
    try {
      await api.updateClinicSchedule(editingClinic.id, {
        name: clinicName,
        address: clinicAddress,
        schedule: clinicSchedule
      });
      setClinicMsg('Clinic details and schedule updated successfully!');
      setTimeout(() => {
        setEditingClinic(null);
        setClinicMsg('');
        loadDoctorData();
      }, 1500);
    } catch (err) {
      setClinicMsg(err.message || 'Update failed.');
    }
  };

  const handleAddMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '' }]);
  };

  const handleRemoveMedicineRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const newMeds = [...medicines];
    newMeds[index][field] = value;
    setMedicines(newMeds);
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    setPrescMsg('');
    try {
      await api.addPrescription({
        appointment_id: prescAppointment.id,
        patient_id: prescAppointment.patient_id,
        diagnosis,
        medicines,
        instructions
      });
      setPrescMsg('Prescription generated successfully! Patient history updated.');
      setTimeout(() => {
        setPrescAppointment(null);
        setDiagnosis('');
        setInstructions('');
        setMedicines([{ name: '', dosage: '', duration: '' }]);
        setPrescMsg('');
        loadDoctorData();
      }, 1500);
    } catch (err) {
      setPrescMsg(err.message || 'Prescription creation failed.');
    }
  };

  // Run Patient timeline audit
  const handlePatientAuditSearch = async (e) => {
    e.preventDefault();
    setAuditMsg('');
    setAuditedPatient(null);
    setAuditedTimeline([]);

    if (!searchPatientId) return;

    try {
      // Fetch timeline
      const timeline = await api.getPatientHistory(searchPatientId);
      setAuditedTimeline(timeline || []);
      
      // Extract patient name from first entry or display default placeholder
      const patientName = timeline.length > 0 ? 'Patient Record' : 'No records found';
      setAuditedPatient({ id: searchPatientId, name: patientName });
    } catch (err) {
      setAuditMsg('Patient records not found or access restricted.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '80px', marginBottom: '20px' }}></div>
        <div className="skeleton" style={{ height: '350px' }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout fade-in">
      <div className="dashboard-content">

        {/* TAB 1: Consultations Calendar */}
        {activeTab === 'dashboard' && (
          <div className="slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Doctor Portal</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Welcome, {user.name}. Manage schedules, audits, and consultations.</p>
              </div>

              {assistant && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '13px'
                }}>
                  <strong style={{ color: 'var(--accent-pink)' }}>Linked Assistant:</strong> {assistant.name}
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Your Consultation Log</h3>
            
            {appointments.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No scheduled consultations recorded yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Patient (ID)</th>
                      <th>Scheduled Slot</th>
                      <th>Age / Gender</th>
                      <th>Blood Group</th>
                      <th>Emergency Contact</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(app => (
                      <tr key={app.id}>
                        <td>
                          <strong>{app.patient_name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>ID: {app.patient_id}</span>
                        </td>
                        <td>
                          <strong>{app.date}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>{app.time_slot}</span>
                        </td>
                        <td>{app.age || 'N/A'} Yrs / {app.gender || 'N/A'}</td>
                        <td>{app.blood_group || 'N/A'}</td>
                        <td>{app.emergency_contact || 'N/A'}</td>
                        <td>
                          <span className={`badge ${
                            app.status === 'confirmed' ? 'badge-success' :
                            app.status === 'pending_payment' ? 'badge-danger' :
                            app.status === 'pending_verification' ? 'badge-warning' :
                            app.status === 'completed' ? 'badge-info' : 'badge-danger'
                          }`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          {app.status === 'confirmed' && (
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => setPrescAppointment(app)}
                            >
                              <PlusSquare size={13} /> Write Prescription
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', marginLeft: '6px' }}
                            onClick={() => {
                              setSearchPatientId(app.patient_id);
                              setActiveTab('patients');
                              // Automatically trigger fetch
                              api.getPatientHistory(app.patient_id)
                                .then(timeline => {
                                  setAuditedTimeline(timeline);
                                  setAuditedPatient({ id: app.patient_id, name: app.patient_name });
                                })
                                .catch(() => {
                                  setAuditMsg('Access denied to history timeline.');
                                });
                            }}
                          >
                            Audit History
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Schedule Management */}
        {activeTab === 'schedule' && (
          <div className="slide-up">
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>Manage Clinics & Slots</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Modify consultation locations, fees, and active schedule hours</p>

            <div className="grid-2">
              {clinics.map(clinic => (
                <div key={clinic.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px' }}>{clinic.name}</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>{clinic.address}</p>
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => handleClinicEdit(clinic)}
                    >
                      <Settings size={13} /> Edit Schedule
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', color: 'var(--accent-pink)', marginBottom: '12px', textTransform: 'uppercase' }}>Weekly Hours</h4>
                    {Object.entries(JSON.parse(clinic.schedule || '{}')).map(([day, slots]) => (
                      <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <strong>{day}:</strong>
                        <span style={{ color: 'var(--text-secondary)' }}>{slots.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Patient Audit */}
        {activeTab === 'patients' && (
          <div className="slide-up">
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>Patient History Audit</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Audit historical reports, lab vitals, and previous prescriptions</p>

            <div className="card glass-panel" style={{ padding: '24px', marginBottom: '30px', maxWidth: '500px' }}>
              <form onSubmit={handlePatientAuditSearch} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter Patient User ID"
                    className="form-control"
                    style={{ paddingLeft: '48px' }}
                    value={searchPatientId}
                    onChange={(e) => setSearchPatientId(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Search
                </button>
              </form>
              {auditMsg && <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '12px' }}>{auditMsg}</p>}
            </div>

            {auditedPatient && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--color-success)' }} />
                  <h3 style={{ fontSize: '18px' }}>Medical History File: Patient ID #{auditedPatient.id}</h3>
                </div>

                {auditedTimeline.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No timeline entries exist for this patient.</p>
                ) : (
                  <div className="timeline">
                    {auditedTimeline.map(item => (
                      <div key={item.id} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-date">{new Date(item.created_at).toLocaleDateString()}</div>
                        <div className="timeline-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.title}
                          <span className={`badge ${item.record_type === 'prescription' ? 'badge-success' : 'badge-info'}`}>
                            {item.record_type}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                          {item.description}
                        </p>
                        {item.doctor_name && (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            <strong>Consultant:</strong> {item.doctor_name}
                          </p>
                        )}
                        {item.record_type === 'prescription' && (
                          <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '12px' }}>
                            <strong>Prescribed Medicines:</strong>
                            <p style={{ color: 'var(--text-secondary)' }}>{item.medicines}</p>
                          </div>
                        )}
                        {item.file_path && (
                          <div style={{ marginTop: '8px' }}>
                            <img
                              src={item.file_path}
                              alt="Vitals screenshot"
                              style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL 1: Write Prescription */}
      {prescAppointment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '40px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} className="fade-in">
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px' }}>Generate Medical Prescription</h3>
              <button 
                onClick={() => { setPrescAppointment(null); setPrescMsg(''); }}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
              <p><strong>Patient:</strong> {prescAppointment.patient_name} (ID: {prescAppointment.patient_id})</p>
              <p><strong>Consult Date:</strong> {prescAppointment.date} at {prescAppointment.time_slot}</p>
            </div>

            <form onSubmit={handlePrescriptionSubmit}>
              <div className="form-group">
                <label className="form-label">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Allergic Bronchitis, Migraine Headaches"
                  className="form-control"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>

              {/* Medicines Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label">Rx (Medicines List)</label>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                    onClick={handleAddMedicineRow}
                  >
                    <Plus size={12} /> Add Row
                  </button>
                </div>

                {medicines.map((med, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      required
                      placeholder="Medicine Name"
                      className="form-control"
                      style={{ flex: 2 }}
                      value={med.name}
                      onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Dosage (e.g. 1-0-1)"
                      className="form-control"
                      style={{ flex: 1.5 }}
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      required
                      placeholder="Duration"
                      className="form-control"
                      style={{ flex: 1 }}
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                    />
                    {medicines.length > 1 && (
                      <button 
                        type="button" 
                        style={{ color: 'var(--color-danger)', cursor: 'pointer', padding: '0 8px' }}
                        onClick={() => handleRemoveMedicineRow(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Special Instructions</label>
                <textarea
                  placeholder="e.g. Drink warm fluids. Rest for 3 days. Take tablets after food."
                  className="form-control"
                  rows="3"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                ></textarea>
              </div>

              {prescMsg && (
                <div style={{
                  background: prescMsg.includes('success') ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: prescMsg.includes('success') ? 'var(--color-success)' : 'var(--color-danger)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {prescMsg}
                </div>
              )}

              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                Publish Prescription & Complete Consultation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Clinic Schedule */}
      {editingClinic && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} className="fade-in">
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px' }}>Edit Clinic & Schedule</h3>
              <button 
                onClick={() => setEditingClinic(null)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleClinicUpdateSubmit}>
              <div className="form-group">
                <label className="form-label">Clinic Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Clinic Address</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Active Practice Days</label>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!clinicSchedule[day]}
                      onChange={(e) => {
                        const newSched = { ...clinicSchedule };
                        if (e.target.checked) {
                          newSched[day] = ["09:00 AM", "11:00 AM", "02:00 PM"];
                        } else {
                          delete newSched[day];
                        }
                        setClinicSchedule(newSched);
                      }}
                      style={{ accentColor: 'var(--accent-pink)' }}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>

              {clinicMsg && (
                <div style={{
                  background: 'var(--color-success-bg)',
                  color: 'var(--color-success)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {clinicMsg}
                </div>
              )}

              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                Save Clinic Adjustments
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

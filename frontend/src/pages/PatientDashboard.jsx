import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { AIHeuristicPredictor } from '../components/AIHeuristicPredictor';
import { PrescriptionPDF } from '../components/PrescriptionPDF';
import { 
  Calendar, 
  Search, 
  Sparkles, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Upload, 
  SlidersHorizontal,
  X,
  Stethoscope,
  Info
} from 'lucide-react';

export function PatientDashboard({ user, activeTab, setActiveTab }) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [specialtyType, setSpecialtyType] = useState(''); // Allopathic, Homeopathic, Herbal
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');

  // Booking Modal
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');

  // Payment Modal
  const [payAppointment, setPayAppointment] = useState(null);
  const [receiptBase64, setReceiptBase64] = useState('');
  const [payMsg, setPayMsg] = useState('');

  // Upload Report
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportType, setReportType] = useState('report');
  const [reportBase64, setReportBase64] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  // Prescription View Modal
  const [activePrescription, setActivePrescription] = useState(null);
  const [activePrescDoc, setActivePrescDoc] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const dbData = await api.getPatientDashboard();
      setAppointments(dbData.appointments || []);

      const docsList = await api.getDoctors();
      setDoctors(docsList || []);

      const histList = await api.getPatientHistory(user.id);
      setHistory(histList || []);
    } catch (err) {
      console.error('Failed to load patient portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run doctor searches when filters change
  const handleFilterSearch = async () => {
    try {
      const filters = {};
      if (specialtyType) filters.specialty = specialtyType;
      if (diseaseSearch) filters.disease = diseaseSearch;
      if (nameSearch) filters.search = nameSearch;

      const filtered = await api.getDoctors(filters);
      setDoctors(filtered || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Convert files to base64
  const handleFileChange = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingMsg('');
    try {
      const res = await api.bookAppointment({
        doctor_id: selectedDoc.id,
        clinic_id: selectedClinic.id,
        date: bookingDate,
        time_slot: bookingSlot
      });
      setBookingMsg('Appointment booked successfully! Slot reserved.');
      setTimeout(() => {
        setSelectedDoc(null);
        setSelectedClinic(null);
        setBookingDate('');
        setBookingSlot('');
        setBookingMsg('');
        loadDashboardData();
      }, 2000);
    } catch (err) {
      setBookingMsg(err.message || 'Booking failed. Slot may be taken.');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPayMsg('');
    try {
      await api.uploadPayment({
        appointment_id: payAppointment.id,
        amount: payAppointment.fees,
        payment_screenshot: receiptBase64
      });
      setPayMsg('Receipt uploaded successfully! Awaiting assistant verification.');
      setTimeout(() => {
        setPayAppointment(null);
        setReceiptBase64('');
        setPayMsg('');
        loadDashboardData();
      }, 2000);
    } catch (err) {
      setPayMsg(err.message || 'Failed to upload receipt.');
    }
  };

  const handleReportUpload = async (e) => {
    e.preventDefault();
    setReportMsg('');
    try {
      await api.uploadPatientReport(user.id, {
        title: reportTitle,
        description: reportDesc,
        record_type: reportType,
        file_path: reportBase64
      });
      setReportMsg('Document uploaded to your timeline successfully!');
      setReportTitle('');
      setReportDesc('');
      setReportBase64('');
      loadDashboardData();
    } catch (err) {
      setReportMsg(err.message || 'Upload failed.');
    }
  };

  const handlePredictorBook = (doc) => {
    setSelectedDoc(doc);
    setSelectedClinic({ id: doc.clinic_id, name: doc.clinic_name, address: doc.clinic_address });
    setActiveTab('search');
  };

  const viewPrescription = (presc, docName) => {
    setActivePrescDoc({ name: docName, specialty: presc.record_type });
    setActivePrescription({
      id: presc.record_id,
      diagnosis: presc.title.replace('Prescription for Diagnosis: ', ''),
      medicines: presc.medicines,
      instructions: presc.instructions,
      created_at: presc.created_at
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '100px', marginBottom: '20px' }}></div>
        <div className="skeleton" style={{ height: '400px' }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout fade-in">
      
      {/* Dynamic Tab Selector linked to Sidebar wrapper */}
      <div className="dashboard-content">
        
        {/* TAB 1: Appointments Overview */}
        {activeTab === 'dashboard' && (
          <div className="slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Welcome, {user.name}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Manage your healthcare schedules and consultations</p>
              </div>
              <button className="btn btn-primary" onClick={() => setActiveTab('search')}>
                <Search size={16} /> Book Consult
              </button>
            </div>

            <h3 style={{ fontSize: '20px', marginBottom: '18px' }}>Your Appointments</h3>
            {appointments.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No scheduled consultations found. Use "Find a Doctor" to book.</p>
              </div>
            ) : (
              <div className="grid-2">
                {appointments.map(app => (
                  <div key={app.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <img 
                          src={app.avatar_url} 
                          alt={app.doctor_name} 
                          style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <h4 style={{ fontSize: '16px' }}>{app.doctor_name}</h4>
                          <span style={{ fontSize: '12px', color: 'var(--accent-pink)', fontWeight: '600' }}>
                            {app.specialty} Medicine
                          </span>
                        </div>
                      </div>
                      <span className={`badge ${
                        app.status === 'confirmed' ? 'badge-success' :
                        app.status === 'pending_payment' ? 'badge-danger' :
                        app.status === 'pending_verification' ? 'badge-warning' :
                        app.status === 'completed' ? 'badge-info' : 'badge-danger'
                      }`}>
                        {app.status === 'pending_payment' && <Clock size={12} />}
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <p><strong>Clinic:</strong> {app.clinic_name}</p>
                      <p><strong>Scheduled Slot:</strong> {app.date} at {app.time_slot}</p>
                      <p><strong>Doctor Fee:</strong> ${app.fees}</p>
                    </div>

                    {app.status === 'pending_payment' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', gap: '8px' }}
                        onClick={() => setPayAppointment(app)}
                      >
                        <CreditCard size={15} /> Upload Receipt Screenshot
                      </button>
                    )}

                    {app.status === 'completed' && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ width: '100%', gap: '8px' }}
                        onClick={async () => {
                          const historyRecords = await api.getPatientHistory(user.id);
                          const matchingPresc = historyRecords.find(r => r.record_type === 'prescription' && r.record_id);
                          if (matchingPresc) {
                            viewPrescription(matchingPresc, app.doctor_name);
                          }
                        }}
                      >
                        <FileText size={15} /> View Prescription
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Search Doctors */}
        {activeTab === 'search' && (
          <div className="slide-up">
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>Find a Medical Specialist</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Filter by healing specialty, symptom, or name</p>

            {/* Filter Panel */}
            <div className="card glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Specialty Category</label>
                  <select 
                    className="form-control" 
                    value={specialtyType} 
                    onChange={(e) => setSpecialtyType(e.target.value)}
                  >
                    <option value="">All Specialties</option>
                    <option value="Allopathic">Allopathic (Traditional/Clinical)</option>
                    <option value="Homeopathic">Homeopathic (Constitutional/Natural)</option>
                    <option value="Herbal">Herbal (Botanical/Holistic)</option>
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Disease Focus / Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Flu, Migraine, Heart"
                    className="form-control"
                    value={diseaseSearch}
                    onChange={(e) => setDiseaseSearch(e.target.value)}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">Doctor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    className="form-control"
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleFilterSearch} style={{ height: '48px', padding: '0 24px' }}>
                    <SlidersHorizontal size={16} /> Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Doctor Grid */}
            <div className="grid-3">
              {doctors.map((doc, idx) => (
                <div 
                  key={doc.id} 
                  className="doctor-profile-card staggered-card"
                  style={{ '--card-index': idx }}
                >
                  {/* Large top photo */}
                  <div className="doctor-profile-img-container">
                    <img 
                      src={doc.avatar_url} 
                      alt={doc.name} 
                      className="doctor-profile-img"
                    />
                    <span 
                      className="badge badge-success" 
                      style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2, background: 'rgba(5, 5, 8, 0.85)' }}
                    >
                      {doc.specialty}
                    </span>
                  </div>

                  {/* Profile Details */}
                  <div className="doctor-profile-details">
                    <div className="doctor-profile-name-row">
                      <h4 className="doctor-profile-name">{doc.name}</h4>
                      <div style={{ color: 'var(--color-success)', display: 'inline-flex' }}>
                        <CheckCircle fill="var(--color-success)" stroke="#fff" size={16} />
                      </div>
                    </div>

                    <p className="doctor-profile-desc">
                      {doc.bio}
                    </p>

                    <div style={{ fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginBottom: '14px', color: 'var(--text-secondary)' }}>
                      <p style={{ color: 'var(--text-muted)' }}>
                        <strong>Focus Areas:</strong> {doc.disease_focus}
                      </p>
                      <p style={{ marginTop: '4px' }}>
                        <strong>Experience:</strong> {doc.experience} Years
                      </p>
                    </div>

                    {/* Bottom metrics and book button */}
                    <div className="doctor-profile-footer">
                      <div className="doctor-profile-metrics">
                        <div className="doctor-profile-metric-item">
                          <span>👤 150+ Consults</span>
                        </div>
                        <div className="doctor-profile-metric-item">
                          <span style={{ color: 'var(--color-warning)' }}>★ {doc.rating || '4.9'}</span>
                        </div>
                      </div>
                      
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '8px 18px', fontSize: '12px' }}
                        onClick={() => {
                          setSelectedDoc(doc);
                          setSelectedClinic({ id: doc.clinic_id, name: doc.clinic_name, address: doc.clinic_address });
                        }}
                      >
                        Book Slot +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AI Symptoms Check */}
        {activeTab === 'ai-predictor' && (
          <div className="slide-up" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <AIHeuristicPredictor doctors={doctors} onSelectDoctor={handlePredictorBook} />
          </div>
        )}

        {/* TAB 4: Medical History timeline */}
        {activeTab === 'history' && (
          <div className="slide-up">
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>My Health History Timeline</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Immutable clinical consultations and lab reports</p>

            <div className="grid-2" style={{ alignItems: 'flex-start' }}>
              
              {/* History list */}
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Timeline Logs</h3>
                {history.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No records uploaded or prescribed yet.</p>
                ) : (
                  <div className="timeline">
                    {history.map(item => (
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
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <strong>Consultant:</strong> {item.doctor_name}
                          </p>
                        )}
                        {item.record_type === 'prescription' && (
                          <button
                            className="btn-text"
                            style={{ fontSize: '12px', marginTop: '6px', display: 'block' }}
                            onClick={() => viewPrescription(item, item.doctor_name)}
                          >
                            Show Printable Prescription
                          </button>
                        )}
                        {item.file_path && (
                          <div style={{ marginTop: '8px' }}>
                            <img
                              src={item.file_path}
                              alt="Medical record attachment"
                              style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Report Panel */}
              <div className="card glass-panel" style={{ padding: '24px', position: 'sticky', top: '40px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Upload Lab Report / Vitals</h3>
                <form onSubmit={handleReportUpload}>
                  <div className="form-group">
                    <label className="form-label">Document Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Blood Test Results, Chest X-Ray"
                      className="form-control"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description / Summary</label>
                    <textarea
                      placeholder="Enter details, doctor notes, or key results..."
                      className="form-control"
                      rows="3"
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Record Category</label>
                      <select className="form-control" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                        <option value="report">Clinical Report</option>
                        <option value="lab_result">Lab Diagnostics</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Attachment Image</label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '48px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed var(--border-subtle)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        fontSize: '13px'
                      }}>
                        <Upload size={14} style={{ marginRight: '6px' }} /> Upload file
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileChange(e, setReportBase64)}
                        />
                      </label>
                    </div>
                  </div>

                  {reportBase64 && (
                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-success)' }}>✓ Screenshot attached!</span>
                    </div>
                  )}

                  {reportMsg && (
                    <div style={{
                      color: 'var(--color-success)',
                      background: 'var(--color-success-bg)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}>
                      {reportMsg}
                    </div>
                  )}

                  <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                    Save Report to History (Immutable)
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: Booking Slot Selection */}
      {selectedDoc && selectedClinic && (
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
              <h3 style={{ fontSize: '18px' }}>Book Appointment Slot</h3>
              <button 
                onClick={() => { setSelectedDoc(null); setSelectedClinic(null); setBookingMsg(''); }}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
              <img src={selectedDoc.avatar_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div>
                <h4 style={{ fontSize: '15px' }}>{selectedDoc.name}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedDoc.specialty} Practice • Fee: ${selectedDoc.fees}</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px', background: 'rgba(255, 46, 147, 0.05)', border: '1px solid rgba(255, 46, 147, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
              <Info size={14} style={{ color: 'var(--accent-pink)', float: 'left', marginRight: '8px', marginTop: '2px' }} />
              <p><strong>Clinic:</strong> {selectedClinic.name}</p>
              <p><strong>Address:</strong> {selectedClinic.address}</p>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label className="form-label">Select Date</label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Available Slots</label>
                <select 
                  className="form-control" 
                  required
                  value={bookingSlot} 
                  onChange={(e) => setBookingSlot(e.target.value)}
                >
                  <option value="">-- Select Time Slot --</option>
                  <option value="09:00 AM">09:00 AM (Mon/Fri)</option>
                  <option value="10:00 AM">10:00 AM (Mon/Fri)</option>
                  <option value="11:00 AM">11:00 AM (Mon/Fri)</option>
                  <option value="02:00 PM">02:00 PM (Wed)</option>
                  <option value="03:00 PM">03:00 PM (Wed)</option>
                  <option value="04:00 PM">04:00 PM (Wed)</option>
                </select>
              </div>

              {bookingMsg && (
                <div style={{
                  background: bookingMsg.includes('success') ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: bookingMsg.includes('success') ? 'var(--color-success)' : 'var(--color-danger)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {bookingMsg}
                </div>
              )}

              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                Confirm Slot Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Receipt Upload Screen */}
      {payAppointment && (
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
          <div className="card glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px' }}>Upload Payment Receipt</h3>
              <button 
                onClick={() => { setPayAppointment(null); setReceiptBase64(''); setPayMsg(''); }}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              To confirm your consultation with <strong>{payAppointment.doctor_name}</strong>, please deposit <strong>${payAppointment.fees}</strong> via bank transfer and upload the receipt image.
            </p>

            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group">
                <label className="form-label">Billing Amount ($)</label>
                <input
                  type="text"
                  disabled
                  className="form-control"
                  value={`$${payAppointment.fees}`}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Receipt File (Image)</label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '70px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: '14px'
                }}>
                  <Upload size={18} style={{ marginRight: '8px' }} /> Click to browse receipt screenshot
                  <input
                    type="file"
                    required
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, setReceiptBase64)}
                  />
                </label>
              </div>

              {receiptBase64 && (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: '600' }}>✓ Screenshot successfully loaded!</span>
                </div>
              )}

              {payMsg && (
                <div style={{
                  background: payMsg.includes('success') ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: payMsg.includes('success') ? 'var(--color-success)' : 'var(--color-danger)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {payMsg}
                </div>
              )}

              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                Submit to Assistant for Verification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable Prescription Viewer */}
      {activePrescription && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 1001,
          overflowY: 'auto',
          padding: '40px 24px',
          display: 'flex',
          justifyContent: 'center'
        }} className="fade-in">
          <div style={{ width: '100%', maxWidth: '800px', position: 'relative' }}>
            
            <button
              className="no-print"
              onClick={() => setActivePrescription(null)}
              style={{
                position: 'fixed',
                right: '40px',
                top: '40px',
                background: 'rgba(255,255,255,0.1)',
                padding: '10px',
                borderRadius: '50%',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={24} />
            </button>

            <PrescriptionPDF 
              prescription={activePrescription} 
              doctor={activePrescDoc} 
              patient={user}
            />
          </div>
        </div>
      )}

    </div>
  );
}

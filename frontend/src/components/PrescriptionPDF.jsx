import React from 'react';
import { Printer, Heart, Download } from 'lucide-react';

export function PrescriptionPDF({ prescription, doctor, patient }) {
  const handlePrint = () => {
    window.print();
  };

  if (!prescription) return null;

  // Parse medicines if stringified JSON
  let medicines = [];
  try {
    medicines = typeof prescription.medicines === 'string' 
      ? JSON.parse(prescription.medicines) 
      : prescription.medicines;
  } catch (err) {
    medicines = [];
  }

  return (
    <div className="card glass-panel print-section-container" style={{ padding: '40px', background: '#fff', color: '#1f2937', border: '1px solid #e5e7eb' }}>
      {/* CSS style local override to support print rendering cleanly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: #fff !important;
            color: #000 !important;
          }
          .print-section-container, .print-section-container * {
            visibility: visible;
          }
          .print-section-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Letterhead */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #ff2e93', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff2e93', fontWeight: '800', fontSize: '22px', fontFamily: 'var(--font-heading)' }}>
            <Heart fill="#ff2e93" size={24} />
            <span>Doctor Hub</span>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Your Holistic Consultation Network</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>{doctor?.name || 'Dr. Practitioner'}</h3>
          <p style={{ fontSize: '13px', color: '#ff2e93', fontWeight: '600' }}>{doctor?.specialty} Treatment Specialist</p>
          <p style={{ fontSize: '12px', color: '#4b5563' }}>{doctor?.email}</p>
        </div>
      </div>

      {/* Patient Details Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px', border: '1px solid #f3f4f6' }}>
        <div>
          <span style={{ color: '#6b7280', display: 'block' }}>Patient Name</span>
          <strong style={{ color: '#111827' }}>{patient?.name || 'N/A'}</strong>
        </div>
        <div>
          <span style={{ color: '#6b7280', display: 'block' }}>Age / Gender</span>
          <strong style={{ color: '#111827' }}>{patient?.age || 'N/A'} Yrs / {patient?.gender || 'N/A'}</strong>
        </div>
        <div>
          <span style={{ color: '#6b7280', display: 'block' }}>Blood Group</span>
          <strong style={{ color: '#111827' }}>{patient?.blood_group || 'N/A'}</strong>
        </div>
        <div>
          <span style={{ color: '#6b7280', display: 'block' }}>Date Issued</span>
          <strong style={{ color: '#111827' }}>{new Date(prescription.created_at || prescription.date).toLocaleDateString()}</strong>
        </div>
      </div>

      {/* Diagnosis Section */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ff2e93', marginBottom: '8px', fontWeight: '700' }}>Diagnosis</h4>
        <p style={{ fontSize: '15px', color: '#1f2937', background: '#fff', borderLeft: '3px solid #ff2e93', paddingLeft: '12px', fontStyle: 'italic' }}>
          {prescription.diagnosis}
        </p>
      </div>

      {/* Rx Medicines Table */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ff2e93', marginBottom: '12px', fontWeight: '700' }}>Rx (Medicines)</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '10px', color: '#374151', fontWeight: '600', textAlign: 'left' }}>#</th>
              <th style={{ padding: '10px', color: '#374151', fontWeight: '600', textAlign: 'left' }}>Medicine Name</th>
              <th style={{ padding: '10px', color: '#374151', fontWeight: '600', textAlign: 'left' }}>Dosage & Timing</th>
              <th style={{ padding: '10px', color: '#374151', fontWeight: '600', textAlign: 'left' }}>Duration</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((med, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 10px', color: '#4b5563' }}>{index + 1}</td>
                <td style={{ padding: '12px 10px', color: '#111827', fontWeight: '600' }}>{med.name}</td>
                <td style={{ padding: '12px 10px', color: '#4b5563' }}>{med.dosage}</td>
                <td style={{ padding: '12px 10px', color: '#4b5563' }}>{med.duration}</td>
              </tr>
            ))}
            {medicines.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '12px 10px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>No medicines added</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Instructions Section */}
      {prescription.instructions && (
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ff2e93', marginBottom: '8px', fontWeight: '700' }}>Special Instructions</h4>
          <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>{prescription.instructions}</p>
        </div>
      )}

      {/* Footer / Signoff */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '20px', fontSize: '12px', color: '#6b7280' }}>
        <div>
          <p>This document is verified and encrypted under Doctor Hub Health Records policy.</p>
          <p style={{ fontWeight: '600', color: '#ff2e93', marginTop: '4px' }}>System UID: RX-00{prescription.id}</p>
        </div>
        <div style={{ textAlign: 'center', minWidth: '150px' }}>
          <div style={{ borderBottom: '1px solid #9ca3af', marginBottom: '6px', height: '30px' }}></div>
          <p style={{ fontWeight: '600', color: '#374151' }}>Authorized Signature</p>
        </div>
      </div>

      {/* Print Controls (Hidden on print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
        <button
          className="btn btn-secondary"
          onClick={handlePrint}
          style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer' }}
        >
          <Printer size={16} /> Print E-Prescription
        </button>
      </div>
    </div>
  );
}

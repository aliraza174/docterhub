import mongoose from 'mongoose';

const MedicalHistorySchema = new mongoose.Schema({
  patient_id: { type: String, required: true },
  doctor_id: { type: String, default: null }, // Nullable if uploaded by patient
  record_type: { type: String, enum: ['prescription', 'report', 'lab_result'], required: true },
  record_id: { type: String, default: null }, // References prescription ID if record_type is prescription
  title: { type: String, required: true },
  description: { type: String, default: '' },
  file_path: { type: String, default: null }, // Base64 attachment
  created_at: { type: Date, default: Date.now }
});

export const MedicalHistory = mongoose.models.MedicalHistory || mongoose.model('MedicalHistory', MedicalHistorySchema);

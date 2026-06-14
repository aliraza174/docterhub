import mongoose from 'mongoose';

const PrescriptionSchema = new mongoose.Schema({
  appointment_id: { type: String, required: true, unique: true },
  doctor_id: { type: String, required: true },
  patient_id: { type: String, required: true },
  date: { type: Date, default: Date.now },
  diagnosis: { type: String, required: true },
  medicines: { type: mongoose.Schema.Types.Mixed, required: true }, // Array of medicines
  instructions: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

export const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);

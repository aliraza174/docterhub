import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patient_id: { type: String, required: true },
  doctor_id: { type: String, required: true },
  clinic_id: { type: String, required: true },
  date: { type: String, required: true },
  time_slot: { type: String, required: true },
  status: { type: String, enum: ['pending_payment', 'pending_verification', 'confirmed', 'completed', 'cancelled'], default: 'pending_payment' },
  created_at: { type: Date, default: Date.now }
});

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

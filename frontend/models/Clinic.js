import mongoose from 'mongoose';

const ClinicSchema = new mongoose.Schema({
  doctor_id: { type: String, required: true }, // References Doctor._id string
  name: { type: String, required: true },
  address: { type: String, required: true },
  schedule: { type: mongoose.Schema.Types.Mixed, default: {} } // Object mapping day to time slots
});

export const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);

import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // References User._id string
  age: { type: Number, default: null },
  gender: { type: String, default: null },
  blood_group: { type: String, default: null },
  emergency_contact: { type: String, default: null }
});

export const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

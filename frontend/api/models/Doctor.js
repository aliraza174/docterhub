import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // References User._id string
  specialty: { type: String, enum: ['Allopathic', 'Homeopathic', 'Herbal'], required: true },
  disease_focus: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  fees: { type: Number, required: true },
  rating: { type: Number, default: 5.0 },
  avatar_url: { type: String, default: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200' }
});

export const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);

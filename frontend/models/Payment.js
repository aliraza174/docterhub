import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  appointment_id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  payment_screenshot: { type: String, required: true }, // Base64 or URL
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verified_by: { type: String, default: null },
  verified_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

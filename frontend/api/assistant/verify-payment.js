import { connectToDatabase } from '../utils/db';
import { Assistant } from '../models/Assistant';
import { Appointment } from '../models/Appointment';
import { Payment } from '../models/Payment';
import { verifyAuth, setCorsHeaders } from '../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const user = await verifyAuth(req, res, 'assistant');
  if (!user) return;

  const { payment_id, status } = req.body; // 'verified' or 'rejected'

  if (!payment_id || !['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Valid payment ID and status (verified/rejected) are required' });
  }

  try {
    const payment = await Payment.findById(payment_id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const assistant = await Assistant.findOne({ id: user.id });
    const appointment = await Appointment.findById(payment.appointment_id);

    if (!appointment) {
      return res.status(404).json({ error: 'Associated appointment not found' });
    }

    if (!assistant || assistant.doctor_id !== appointment.doctor_id) {
      return res.status(403).json({ error: 'Unauthorized to verify payments for this doctor' });
    }

    const verifiedAt = new Date();
    payment.status = status;
    payment.verified_by = user.id;
    payment.verified_at = verifiedAt;
    await payment.save();

    const appStatus = status === 'verified' ? 'confirmed' : 'cancelled';
    appointment.status = appStatus;
    await appointment.save();

    res.json({ message: `Payment is successfully ${status}. Appointment is now ${appStatus}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

import { connectToDatabase } from '../utils/db';
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
  const user = await verifyAuth(req, res, 'patient');
  if (!user) return;

  const { appointment_id, amount, payment_screenshot } = req.body;

  if (!appointment_id || !amount || !payment_screenshot) {
    return res.status(400).json({ error: 'Appointment ID, amount, and payment screenshot are required' });
  }

  try {
    const appointment = await Appointment.findOne({ _id: appointment_id, patient_id: user.id });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or not owned by you' });
    }

    // Insert or update payment (upsert-like behavior)
    let payment = await Payment.findOne({ appointment_id });
    if (payment) {
      payment.amount = amount;
      payment.payment_screenshot = payment_screenshot;
      payment.status = 'pending';
      await payment.save();
    } else {
      payment = new Payment({
        appointment_id,
        amount,
        payment_screenshot,
        status: 'pending'
      });
      await payment.save();
    }

    // Update appointment status to pending_verification
    appointment.status = 'pending_verification';
    await appointment.save();

    res.json({ message: 'Payment screenshot uploaded successfully. Awaiting verification from medical assistant.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process payment upload' });
  }
}

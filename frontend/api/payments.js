import { connectToDatabase } from './utils/db';
import { Appointment } from './models/Appointment';
import { Payment } from './models/Payment';
import { Assistant } from './models/Assistant';
import { User } from './models/User';
import { verifyAuth, setCorsHeaders } from './utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectToDatabase();
  const pathname = req.url.split('?')[0];

  // 1. ASSISTANT REVIEW LIST (GET /api/assistant/payments)
  if (pathname === '/api/assistant/payments') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const user = await verifyAuth(req, res, 'assistant');
    if (!user) return;

    try {
      const assistant = await Assistant.findOne({ id: user.id });
      if (!assistant || !assistant.doctor_id) {
        return res.status(400).json({ error: 'You are not linked to any doctor yet. Ask Admin to assign you.' });
      }

      const appointments = await Appointment.find({
        doctor_id: assistant.doctor_id,
        status: 'pending_verification'
      });
      const appointmentIds = appointments.map(a => a._id.toString());

      const payments = await Payment.find({
        appointment_id: { $in: appointmentIds },
        status: 'pending'
      });

      const pendingList = [];
      for (const p of payments) {
        const a = appointments.find(app => app._id.toString() === p.appointment_id);
        if (!a) continue;
        const patientUser = await User.findById(a.patient_id);
        if (!patientUser) continue;

        pendingList.push({
          payment_id: p._id.toString(),
          amount: p.amount,
          payment_screenshot: p.payment_screenshot,
          payment_status: p.status,
          paid_at: p.created_at,
          appointment_id: a._id.toString(),
          date: a.date,
          time_slot: a.time_slot,
          appointment_status: a.status,
          patient_name: patientUser.name,
          patient_email: patientUser.email
        });
      }

      return res.json(pendingList);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch pending payments' });
    }
  }

  // 2. ASSISTANT VERIFY PAYMENT (POST /api/assistant/verify-payment)
  if (pathname === '/api/assistant/verify-payment') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

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

      return res.json({ message: `Payment is successfully ${status}. Appointment is now ${appStatus}.` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Verification failed' });
    }
  }

  // 3. PATIENT UPLOADS SCREENSHOT (POST /api/payments)
  if (pathname === '/api/payments') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

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

      appointment.status = 'pending_verification';
      await appointment.save();

      return res.json({ message: 'Payment screenshot uploaded successfully. Awaiting verification from medical assistant.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to process payment upload' });
    }
  }

  // Fallback
  return res.status(404).json({ error: 'Payments endpoint not found' });
}

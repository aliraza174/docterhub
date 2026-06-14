import { connectToDatabase } from '../utils/db';
import { Assistant } from '../models/Assistant';
import { Appointment } from '../models/Appointment';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { verifyAuth, setCorsHeaders } from '../utils/auth';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  await connectToDatabase();
  const user = await verifyAuth(req, res, 'assistant');
  if (!user) return;

  try {
    const assistant = await Assistant.findOne({ id: user.id });
    if (!assistant || !assistant.doctor_id) {
      return res.status(400).json({ error: 'You are not linked to any doctor yet. Ask Admin to assign you.' });
    }

    // Find appointments for the doctor that have pending payments
    const appointments = await Appointment.find({
      doctor_id: assistant.doctor_id,
      status: 'pending_verification'
    });
    const appointmentIds = appointments.map(a => a._id.toString());

    // Find matching payments
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

    res.json(pendingList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
}
